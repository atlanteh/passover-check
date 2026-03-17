import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useHouse } from '../context/HouseContext'
import { useRooms } from '../hooks/useRooms'
import { addTask } from '../services/taskService'
import { useToast } from '../context/ToastContext'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { TaskFormData } from '../types'

export default function TaskAddPage() {
  const navigate = useNavigate()
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { rooms } = useRooms(selectedHouse?.id)
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TaskFormData>({
    roomId: '',
    title: '',
    description: '',
    estimatedMinutes: 15,
    required: true,
    priority: 'medium',
    dueAt: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHouse || !activeSeason || !form.roomId || !form.title.trim()) return

    setSaving(true)
    try {
      await addTask({
        houseId: selectedHouse.id,
        seasonId: activeSeason.id,
        ...form,
      })
      toast('משימה נוספה בהצלחה', 'success')
      navigate('/tasks')
    } catch {
      toast('שגיאה בהוספת משימה', 'error')
    }
    setSaving(false)
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-muted">צרו עונה כדי להוסיף משימות</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <h2 className="text-xl font-bold">משימה חדשה</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">חדר</label>
          <select
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            required
          >
            <option value="">בחרו חדר</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שם המשימה</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            placeholder="לדוגמה: לנקות את המקרר"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">תיאור (אופציונלי)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 resize-none"
            rows={2}
            placeholder="פירוט נוסף..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">זמן משוער (דקות)</label>
            <input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
              min={1}
              max={480}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">עדיפות</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskFormData['priority'] })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">תאריך יעד (אופציונלי)</label>
          <input
            type="date"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
            className="w-5 h-5 rounded accent-primary-600"
          />
          <span className="text-sm">משימה חובה (נדרשת להשלמת פסח)</span>
        </label>

        <button
          type="submit"
          disabled={saving || !form.roomId || !form.title.trim()}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          הוספת משימה
        </button>
      </form>
    </div>
  )
}
