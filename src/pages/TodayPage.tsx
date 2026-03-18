import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import { useHouse } from '../context/HouseContext'
import { toDateString, startOfDay, formatDate, formatHebrewDateShort, isBeforeToday } from '../utils/date'
import TaskCard from '../components/task/TaskCard'
import { Calendar, CheckCircle2, Loader2, CalendarRange, AlertTriangle } from 'lucide-react'

export default function TodayPage() {
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { tasks, loading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { rooms } = useRooms(selectedHouse?.id)

  const todayStr = toDateString(startOfDay(new Date()))

  const { todayTasks, hasAnyScheduled, overdueCount, totalMinutes } = useMemo(() => {
    const scheduled = tasks.filter((t) => t.scheduledDate === todayStr)
    const anyScheduled = tasks.some((t) => t.scheduledDate)
    const overdue = tasks.filter(
      (t) =>
        t.scheduledDate &&
        isBeforeToday(t.scheduledDate) &&
        (t.status === 'pending' || t.status === 'in_progress')
    ).length
    return {
      todayTasks: scheduled,
      hasAnyScheduled: anyScheduled,
      overdueCount: overdue,
      totalMinutes: scheduled.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    }
  }, [tasks, todayStr])

  const completedToday = todayTasks.filter((t) => t.status === 'done').length

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
        <p className="text-on-surface-muted">אין עונה פעילה</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Calendar className="text-primary-600" size={24} />
        <div>
          <h2 className="text-xl font-bold">היום</h2>
          <p className="text-sm text-on-surface-muted">{formatDate(new Date())}</p>
          <p className="text-xs text-on-surface-muted">{formatHebrewDateShort(new Date())}</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <Link
          to="/schedule"
          className="flex items-center gap-2 bg-warning-50 border border-warning-200 rounded-xl px-3 py-2 text-sm text-warning-700"
        >
          <AlertTriangle size={16} />
          <span>{overdueCount} משימות באיחור</span>
        </Link>
      )}

      {!hasAnyScheduled && tasks.length > 0 ? (
        <div className="text-center py-16">
          <CalendarRange size={48} className="mx-auto text-on-surface-muted mb-3" />
          <h3 className="text-lg font-semibold mb-1">לא שובצו משימות</h3>
          <p className="text-on-surface-muted mb-4">לכו ללו״ז לשיבוץ משימות</p>
          <Link
            to="/schedule"
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium inline-block"
          >
            ללו״ז
          </Link>
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 size={48} className="mx-auto text-success-500 mb-3" />
          <h3 className="text-lg font-semibold mb-1">אין משימות להיום!</h3>
          <p className="text-on-surface-muted">נהדר, אפשר לנוח</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <span className="text-sm text-on-surface-muted">
              {totalMinutes} דקות · {todayTasks.length} משימות
            </span>
            <span className="text-sm font-medium text-primary-600">
              {completedToday}/{todayTasks.length} הושלמו
            </span>
          </div>

          <div className="space-y-2">
            {todayTasks.map((task) => {
              const room = rooms.find((r) => r.id === task.roomId)
              return <TaskCard key={task.id} task={task} roomName={room?.name} roomIcon={room?.icon} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
