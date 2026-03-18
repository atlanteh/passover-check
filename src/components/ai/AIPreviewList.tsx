import type { AIGeneratedRoom, AIGeneratedTask, TaskPriority } from '../../types'
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

  function updateTask(roomIndex: number, taskIndex: number, updates: Partial<AIGeneratedTask>) {
    onChange(
      rooms.map((room, ri) =>
        ri === roomIndex
          ? {
              ...room,
              tasks: room.tasks.map((t, ti) =>
                ti === taskIndex ? { ...t, ...updates } : t
              ),
            }
          : room
      )
    )
  }

  function updateRoomName(roomIndex: number, name: string) {
    onChange(
      rooms.map((room, ri) =>
        ri === roomIndex ? { ...room, name } : room
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
              <input
                type="text"
                value={room.name}
                onChange={(e) => updateRoomName(ri, e.target.value)}
                className="font-semibold flex-1 bg-transparent border-b border-transparent focus:border-primary-400 outline-none"
              />
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
                <div key={ti} className="px-4 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(ri, ti, { title: e.target.value })}
                      className="text-sm font-medium flex-1 bg-transparent border-b border-transparent focus:border-primary-400 outline-none min-w-0"
                    />
                    <button
                      onClick={() => removeTask(ri, ti)}
                      className="text-on-surface-muted hover:text-danger-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-muted">
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      <input
                        type="number"
                        value={task.estimatedMinutes}
                        onChange={(e) => updateTask(ri, ti, { estimatedMinutes: Number(e.target.value) || 1 })}
                        className="w-10 bg-transparent border-b border-transparent focus:border-primary-400 outline-none text-center"
                        min={1}
                        max={480}
                      />
                      דק׳
                    </span>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(ri, ti, { priority: e.target.value as TaskPriority })}
                      className="bg-transparent outline-none text-xs"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.required}
                        onChange={(e) => updateTask(ri, ti, { required: e.target.checked })}
                        className="w-3 h-3 accent-primary-600"
                      />
                      <span className={task.required ? 'text-primary-600' : ''}>חובה</span>
                    </label>
                    {task.checklist && task.checklist.length > 0 && (
                      <span className="text-primary-500">{task.checklist.length} פריטים</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
