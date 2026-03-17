import { useState } from 'react'
import { useHouse } from '../context/HouseContext'
import { useRooms } from '../hooks/useRooms'
import RoomCard from '../components/room/RoomCard'
import RoomForm from '../components/room/RoomForm'
import { addRoom, updateRoom, reorderRooms } from '../services/roomService'
import { useToast } from '../context/ToastContext'
import { Plus, Loader2 } from 'lucide-react'
import type { RoomFormData, Room } from '../types'

export default function RoomsPage() {
  const { selectedHouse } = useHouse()
  const { rooms, loading } = useRooms(selectedHouse?.id)
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  async function handleAdd(data: RoomFormData) {
    if (!selectedHouse) return
    try {
      await addRoom(selectedHouse.id, data, rooms.length)
      toast('חדר נוסף בהצלחה', 'success')
      setShowForm(false)
    } catch {
      toast('שגיאה בהוספת חדר', 'error')
    }
  }

  async function handleEdit(data: RoomFormData) {
    if (!editingRoom) return
    try {
      await updateRoom(editingRoom.id, data)
      toast('חדר עודכן', 'success')
      setEditingRoom(null)
    } catch {
      toast('שגיאה בעדכון חדר', 'error')
    }
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return
    try {
      await reorderRooms(rooms, index, index - 1)
    } catch {
      toast('שגיאה בסידור מחדש', 'error')
    }
  }

  async function handleMoveDown(index: number) {
    if (index >= rooms.length - 1) return
    try {
      await reorderRooms(rooms, index, index + 1)
    } catch {
      toast('שגיאה בסידור מחדש', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">חדרים</h2>
        <button
          onClick={() => { setShowForm(true); setEditingRoom(null) }}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          חדר חדש
        </button>
      </div>

      {(showForm || editingRoom) && (
        <RoomForm
          initial={editingRoom ? { name: editingRoom.name, icon: editingRoom.icon } : undefined}
          onSubmit={editingRoom ? handleEdit : handleAdd}
          onCancel={() => { setShowForm(false); setEditingRoom(null) }}
        />
      )}

      {rooms.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏠</div>
          <p className="text-on-surface-muted">אין חדרים עדיין</p>
          <p className="text-sm text-on-surface-muted">הוסיפו חדרים לבית כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => { setEditingRoom(room); setShowForm(false) }}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
              isFirst={i === 0}
              isLast={i === rooms.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
