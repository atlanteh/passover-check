import { useState } from 'react'
import { formatDayOfWeek, formatHebrewDateShort, toDateString, startOfDay } from '../../utils/date'
import type { Task, Room } from '../../types'
import TaskCard from '../task/TaskCard'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ScheduleDayCardProps {
  dateStr: string
  tasks: Task[]
  rooms: Room[]
  onMoveTask: (taskId: string) => void
  defaultCollapsed?: boolean
}

export default function ScheduleDayCard({
  dateStr,
  tasks,
  rooms,
  onMoveTask,
  defaultCollapsed = false,
}: ScheduleDayCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const todayStr = toDateString(startOfDay(new Date()))
  const isToday = dateStr === todayStr
  const isPast = dateStr < todayStr
  const date = new Date(dateStr + 'T00:00:00')
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length
  const roomMap = new Map(rooms.map((r) => [r.id, r]))

  return (
    <div className={`rounded-xl overflow-hidden ${isPast && !isToday ? 'opacity-60' : ''}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full text-start px-4 py-3 flex items-center justify-between sticky top-0 z-10 ${
          isToday ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
        } rounded-xl`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isToday ? 'text-primary-700' : ''}`}>
              {isToday ? 'היום · ' : ''}{formatDayOfWeek(date)}
            </span>
            <span className="text-sm text-on-surface-muted">
              {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            </span>
            <span className="text-xs text-on-surface-muted">
              {formatHebrewDateShort(date)}
            </span>
          </div>
          <div className="text-xs text-on-surface-muted mt-0.5">
            {pendingCount} משימות · {totalMinutes} דק׳
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-2 mt-2">
          {tasks.map((task) => {
            const room = roomMap.get(task.roomId)
            return (
              <TaskCard
                key={task.id}
                task={task}
                roomName={room?.name}
                roomIcon={room?.icon}
                onMove={() => onMoveTask(task.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
