import type { Room } from '../../types'
import { ROOM_ICONS } from '../../types'
import { formatHebrewDateShort } from '../../utils/date'
import { ChevronUp, ChevronDown, Pencil } from 'lucide-react'

interface RoomCardProps {
  room: Room
  onEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

export default function RoomCard({ room, onEdit, onMoveUp, onMoveDown, isFirst, isLast }: RoomCardProps) {
  const icon = ROOM_ICONS[room.icon] ?? '📍'

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <span className="font-medium">{room.name}</span>
        {room.minDate && (
          <div className="text-xs text-on-surface-muted">
            לא לפני {new Date(room.minDate + 'T00:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            {' · '}
            {formatHebrewDateShort(new Date(room.minDate + 'T00:00:00'))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 text-on-surface-muted hover:text-primary-600 disabled:opacity-30"
        >
          <ChevronUp size={18} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 text-on-surface-muted hover:text-primary-600 disabled:opacity-30"
        >
          <ChevronDown size={18} />
        </button>
        <button
          onClick={onEdit}
          className="p-1 text-on-surface-muted hover:text-primary-600"
        >
          <Pencil size={16} />
        </button>
      </div>
    </div>
  )
}
