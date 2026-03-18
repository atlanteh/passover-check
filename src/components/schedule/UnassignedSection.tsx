import { useState } from 'react'
import type { Task, Room } from '../../types'
import TaskCard from '../task/TaskCard'
import { ChevronDown, ChevronUp, Wand2 } from 'lucide-react'

interface UnassignedSectionProps {
  tasks: Task[]
  rooms: Room[]
  onMoveTask: (taskId: string) => void
  onAutoAssign: () => void
  autoAssigning: boolean
}

export default function UnassignedSection({
  tasks,
  rooms,
  onMoveTask,
  onAutoAssign,
  autoAssigning,
}: UnassignedSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const roomMap = new Map(rooms.map((r) => [r.id, r]))

  if (tasks.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-start px-4 py-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl"
      >
        <div>
          <span className="font-semibold text-amber-700">ללא תאריך</span>
          <span className="text-xs text-amber-600 mr-2">{tasks.length} משימות</span>
        </div>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {!collapsed && (
        <div className="space-y-2 mt-2">
          <button
            onClick={onAutoAssign}
            disabled={autoAssigning}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Wand2 size={16} />
            {autoAssigning ? 'משבץ...' : 'שיבוץ אוטומטי'}
          </button>

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
