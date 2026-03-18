import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useHouse } from '../context/HouseContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import { useToast } from '../context/ToastContext'
import { setTaskScheduledDate, batchUpdateScheduledDates } from '../services/taskService'
import { computeScheduleAssignments } from '../utils/scheduling'
import { toDateString, startOfDay, addDays, isBeforeToday, generateDateRange } from '../utils/date'
import { calculateDashboardStats } from '../utils/dashboard'
import DayPickerModal from '../components/schedule/DayPickerModal'
import OverdueBanner from '../components/schedule/OverdueBanner'
import ScheduleDayCard from '../components/schedule/ScheduleDayCard'
import UnassignedSection from '../components/schedule/UnassignedSection'
import { CalendarRange, Loader2, Filter } from 'lucide-react'

const FINISH_DAYS_BEFORE = 2

export default function SchedulePage() {
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { tasks, loading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { rooms } = useRooms(selectedHouse?.id)
  const { toast } = useToast()

  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState<string>(() => sessionStorage.getItem('schedule-filter-assignee') ?? 'all')
  const todayRef = useRef<HTMLDivElement>(null)

  function handleFilterAssignee(value: string) {
    setFilterAssignee(value)
    sessionStorage.setItem('schedule-filter-assignee', value)
  }

  function filterByAssignee<T extends { assignedTo?: string }>(items: T[]): T[] {
    if (filterAssignee === 'all') return items
    if (filterAssignee === '_unassigned') return items.filter((t) => !t.assignedTo)
    return items.filter((t) => t.assignedTo === filterAssignee)
  }

  const todayStr = toDateString(startOfDay(new Date()))

  // Derive date range and task groupings
  const { dateRange, tasksByDate, overdueTasks, unassignedTasks, minutesByDate, dailyTarget } =
    useMemo(() => {
      if (!activeSeason) {
        return {
          dateRange: [] as string[],
          tasksByDate: new Map<string, typeof tasks>(),
          overdueTasks: [] as typeof tasks,
          unassignedTasks: [] as typeof tasks,
          minutesByDate: new Map<string, number>(),
          dailyTarget: 60,
        }
      }

      const targetDate = addDays(startOfDay(activeSeason.targetDate.toDate()), -FINISH_DAYS_BEFORE)
      const dates = generateDateRange(startOfDay(new Date()), targetDate)

      const pending = tasks.filter(
        (t) => t.status === 'pending' || t.status === 'in_progress'
      )

      const byDate = new Map<string, typeof tasks>()
      const overdue: typeof tasks = []
      const unassigned: typeof tasks = []

      for (const task of pending) {
        if (!task.scheduledDate) {
          unassigned.push(task)
        } else if (isBeforeToday(task.scheduledDate)) {
          overdue.push(task)
        } else {
          const arr = byDate.get(task.scheduledDate) ?? []
          arr.push(task)
          byDate.set(task.scheduledDate, arr)
        }
      }

      // Also add done/skipped tasks to their scheduled date for visibility
      for (const task of tasks) {
        if ((task.status === 'done' || task.status === 'skipped') && task.scheduledDate) {
          const arr = byDate.get(task.scheduledDate) ?? []
          arr.push(task)
          byDate.set(task.scheduledDate, arr)
        }
      }

      const minByDate = new Map<string, number>()
      for (const [date, dateTasks] of byDate) {
        minByDate.set(
          date,
          dateTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
        )
      }

      const stats = calculateDashboardStats(tasks, activeSeason)

      return {
        dateRange: dates,
        tasksByDate: byDate,
        overdueTasks: overdue,
        unassignedTasks: unassigned,
        minutesByDate: minByDate,
        dailyTarget: stats.dailyTargetMinutes,
      }
    }, [tasks, activeSeason])

  // Scroll to today on mount
  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

  async function handleMoveTask(taskId: string) {
    setMovingTaskId(taskId)
  }

  async function handleDateSelected(date: string | null) {
    if (!movingTaskId) return
    try {
      await setTaskScheduledDate(movingTaskId, date)
      toast('משימה הועברה', 'success')
    } catch {
      toast('שגיאה בהעברת משימה', 'error')
    }
    setMovingTaskId(null)
  }

  async function handleAutoAssign() {
    if (!activeSeason) return
    setAutoAssigning(true)
    try {
      const assignments = computeScheduleAssignments(tasks, activeSeason, rooms)
      const updates = Array.from(assignments.entries()).map(([taskId, scheduledDate]) => ({
        taskId,
        scheduledDate,
      }))
      if (updates.length > 0) {
        await batchUpdateScheduledDates(updates)
        toast(`${updates.length} משימות שובצו`, 'success')
      } else {
        toast('אין משימות לשיבוץ', 'info')
      }
    } catch {
      toast('שגיאה בשיבוץ אוטומטי', 'error')
    }
    setAutoAssigning(false)
  }

  async function handleMoveAllToToday() {
    try {
      const updates = overdueTasks.map((t) => ({ taskId: t.id, scheduledDate: todayStr }))
      await batchUpdateScheduledDates(updates)
      toast(`${updates.length} משימות הועברו להיום`, 'success')
    } catch {
      toast('שגיאה בהעברה', 'error')
    }
  }

  async function handleRedistribute() {
    if (!activeSeason) return
    try {
      // Clear overdue scheduled dates first
      const clearUpdates = overdueTasks.map((t) => ({
        taskId: t.id,
        scheduledDate: null as string | null,
      }))
      await batchUpdateScheduledDates(clearUpdates)
      // Then auto-assign (tasks will now be unassigned and picked up by the algorithm)
      // We need to wait for Firestore update to propagate through useTasks
      toast('משימות באיחור חולקו מחדש — לחצו שיבוץ אוטומטי', 'info')
    } catch {
      toast('שגיאה בחלוקה מחדש', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-20">
        <CalendarRange size={48} className="mx-auto text-on-surface-muted mb-3" />
        <p className="text-on-surface-muted">אין עונה פעילה</p>
        <Link to="/seasons/new" className="text-primary-600 underline text-sm mt-2 inline-block">
          יצירת עונה חדשה
        </Link>
      </div>
    )
  }

  const movingTask = movingTaskId ? tasks.find((t) => t.id === movingTaskId) : undefined

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <CalendarRange className="text-primary-600" size={24} />
        <h2 className="text-xl font-bold">לו״ז</h2>
      </div>

      {selectedHouse?.assignees && selectedHouse.assignees.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-on-surface-muted" />
          <select
            value={filterAssignee}
            onChange={(e) => handleFilterAssignee(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          >
            <option value="all">כולם</option>
            <option value="_unassigned">ללא משויך</option>
            {selectedHouse.assignees.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <OverdueBanner
        count={overdueTasks.length}
        onMoveToToday={handleMoveAllToToday}
        onRedistribute={handleRedistribute}
      />

      <div className="space-y-4">
        {dateRange.map((dateStr) => {
          const dayTasks = filterByAssignee(tasksByDate.get(dateStr) ?? [])
          if (dayTasks.length === 0 && dateStr !== todayStr) return null
          return (
            <div key={dateStr} ref={dateStr === todayStr ? todayRef : undefined}>
              <ScheduleDayCard
                dateStr={dateStr}
                tasks={dayTasks}
                rooms={rooms}
                onMoveTask={handleMoveTask}
                defaultCollapsed={dateStr < todayStr}
              />
            </div>
          )
        })}
      </div>

      <UnassignedSection
        tasks={filterByAssignee(unassignedTasks)}
        rooms={rooms}
        onMoveTask={handleMoveTask}
        onAutoAssign={handleAutoAssign}
        autoAssigning={autoAssigning}
      />

      <DayPickerModal
        open={movingTaskId !== null}
        onClose={() => setMovingTaskId(null)}
        onSelectDate={handleDateSelected}
        dates={dateRange}
        minutesByDate={minutesByDate}
        dailyTarget={dailyTarget}
        currentDate={movingTask?.scheduledDate ?? undefined}
      />
    </div>
  )
}
