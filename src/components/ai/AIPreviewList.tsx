import type { AIGeneratedRoom } from '../../types'
import { ROOM_ICONS, PRIORITY_LABELS } from '../../types'
import { Trash2, Clock } from 'lucide-react'

interface AIPreviewListProps {
  rooms: AIGeneratedRoom[]
  onChange: (rooms: AIGeneratedRoom[]) => void
}

export default function AIPreviewList({ rooms, onChange }: AIPreviewListProps) {
  function removeRoom(roomIndex: number) {
    onChange(rooms.filter((_, i) => i !== roomIndex))
  }

  function removeTask(roomIndex: number, taskIndex: number) {
    onChange(
      rooms.map((room, ri) =>
        ri === roomIndex
          ? { ...room, tasks: room.tasks.filter((_, ti) => ti !== taskIndex) }
          : room
      )
    )
  }

  return (
    <div className="space-y-4">
      {rooms.map((room, ri) => {
        const icon = ROOM_ICONS[room.icon] ?? '📍'
        return (
          <div key={ri} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 border-b border-primary-100">
              <span className="text-xl">{icon}</span>
              <h3 className="font-semibold flex-1">{room.name}</h3>
              <span className="text-xs text-primary-600">{room.tasks.length} משימות</span>
              <button
                onClick={() => removeRoom(ri)}
                className="text-on-surface-muted hover:text-danger-600"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {room.tasks.map((task, ti) => (
                <div key={ti} className="px-4 py-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-muted">
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {task.estimatedMinutes} דק׳
                      </span>
                      <span>{PRIORITY_LABELS[task.priority]}</span>
                      {task.required && <span className="text-primary-600">חובה</span>}
                      {task.checklist && task.checklist.length > 0 && (
                        <span className="text-primary-500">{task.checklist.length} פריטים</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(ri, ti)}
                    className="text-on-surface-muted hover:text-danger-600 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
