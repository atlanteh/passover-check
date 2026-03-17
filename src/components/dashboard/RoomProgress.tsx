import type { Room, Task } from '../../types'
import { ROOM_ICONS } from '../../types'

interface RoomProgressProps {
  room: Room
  tasks: Task[]
}

export default function RoomProgress({ room, tasks }: RoomProgressProps) {
  const roomTasks = tasks.filter((t) => t.roomId === room.id)
  const total = roomTasks.length
  const done = roomTasks.filter((t) => t.status === 'done' || t.status === 'skipped').length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const icon = ROOM_ICONS[room.icon] ?? '📍'

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="font-medium flex-1">{room.name}</span>
        <span className="text-sm text-on-surface-muted">{done}/{total}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percent >= 100 ? 'bg-success-500' : 'bg-primary-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
