import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useHouse } from '../context/HouseContext'
import { useRooms } from '../hooks/useRooms'
import { useTasks } from '../hooks/useTasks'
import { updateTask } from '../services/taskService'
import { useToast } from '../context/ToastContext'
import { ArrowRight, Loader2, Trash2, Plus, X } from 'lucide-react'
import type { TaskFormData, ChecklistItem } from '../types'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function TaskEditPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { rooms } = useRooms(selectedHouse?.id)
  const { tasks, loading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const task = tasks.find((t) => t.id === taskId)

  const [form, setForm] = useState<TaskFormData | null>(null)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[] | null>(null)
  const [newChecklistItem, setNewChecklistItem] = useState('')

  // Initialize form when task loads
  if (task && !form) {
    setForm({
      roomId: task.roomId,
      title: task.title,
      description: task.description ?? '',
      estimatedMinutes: task.estimatedMinutes,
      required: task.required,
      priority: task.priority,
      dueAt: task.dueAt ? new Date(task.dueAt.seconds * 1000).toISOString().split('T')[0]! : '',
    })
    setAssignedTo(task.assignedTo ?? '')
    setChecklistItems(task.checklist ? [...task.checklist] : [])
  }

  function handleAddChecklistItem() {
    if (!newChecklistItem.trim() || !checklistItems) return
    setChecklistItems([...checklistItems, { label: newChecklistItem.trim(), done: false }])
    setNewChecklistItem('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !form || !form.title.trim()) return

    setSaving(true)
    try {
      await updateTask(task.id, {
        roomId: form.roomId,
        title: form.title.trim(),
        description: form.description || null,
        estimatedMinutes: form.estimatedMinutes,
        required: form.required,
        priority: form.priority,
        assignedTo: assignedTo || null,
        checklist: checklistItems && checklistItems.length > 0 ? checklistItems : null,
      })
      toast('משימה עודכנה', 'success')
      navigate(-1)
    } catch {
      toast('שגיאה בעדכון', 'error')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'tasks', task.id))
      toast('משימה נמחקה', 'success')
      navigate('/tasks', { replace: true })
    } catch {
      toast('שגיאה במחיקה', 'error')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (!task || !form) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-muted">משימה לא נמצאה</p>
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 text-primary-600 underline"
        >
          חזרה למשימות
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <h2 className="text-xl font-bold">עריכת משימה</h2>
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

        {selectedHouse?.assignees && selectedHouse.assignees.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">משויך ל</label>
            <select
              value={assignedTo ?? ''}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <option value="">ללא משויך</option>
              {selectedHouse.assignees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">שם המשימה</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
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
          <label className="block text-sm font-medium mb-1">רשימת משנה</label>
          {checklistItems?.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const updated = [...checklistItems]
                  const current = updated[i]
                  if (current) updated[i] = { ...current, label: e.target.value }
                  setChecklistItems(updated)
                }}
                className={`text-sm flex-1 bg-transparent border-b border-gray-200 focus:border-primary-400 outline-none px-1 py-0.5 ${item.done ? 'line-through text-on-surface-muted' : ''}`}
              />
              <button
                type="button"
                onClick={() => setChecklistItems(checklistItems.filter((_, idx) => idx !== i))}
                className="text-on-surface-muted hover:text-danger-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem() } }}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="פריט חדש..."
            />
            <button
              type="button"
              onClick={handleAddChecklistItem}
              className="bg-gray-100 text-on-surface-muted px-3 py-2 rounded-xl hover:bg-gray-200"
            >
              <Plus size={16} />
            </button>
          </div>
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
          שמירה
        </button>
      </form>

      <div className="pt-2 border-t border-gray-100">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-danger-500">למחוק את המשימה?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
              כן, מחק
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="bg-gray-100 text-on-surface-muted px-4 py-2 rounded-xl text-sm font-medium"
            >
              ביטול
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-danger-500 text-sm flex items-center gap-1"
          >
            <Trash2 size={14} />
            מחיקת משימה
          </button>
        )}
      </div>
    </div>
  )
}
