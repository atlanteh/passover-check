import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHouse } from '../context/HouseContext'
import { useSeason } from '../context/SeasonContext'
import { generateRoomsAndTasks } from '../services/aiService'
import { addRoom } from '../services/roomService'
import { batchAddTasks } from '../services/taskService'
import { useRooms } from '../hooks/useRooms'
import { useToast } from '../context/ToastContext'
import AIPreviewList from '../components/ai/AIPreviewList'
import type { AIGeneratedRoom } from '../types'
import { Sparkles, ArrowRight, Loader2, Wand2 } from 'lucide-react'

type Step = 'input' | 'loading' | 'preview'

export default function AIWizardPage() {
  const navigate = useNavigate()
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { rooms: existingRooms } = useRooms(selectedHouse?.id)
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('input')
  const [description, setDescription] = useState('')
  const [generated, setGenerated] = useState<AIGeneratedRoom[]>([])
  const [saving, setSaving] = useState(false)

  async function handleGenerate() {
    if (!description.trim()) return
    setStep('loading')
    try {
      const result = await generateRoomsAndTasks(description)
      setGenerated(result)
      setStep('preview')
    } catch {
      toast('שגיאה ביצירה עם AI, נסו שוב', 'error')
      setStep('input')
    }
  }

  async function handleConfirm() {
    if (!selectedHouse || !activeSeason) return
    setSaving(true)
    try {
      for (const room of generated) {
        const roomId = await addRoom(
          selectedHouse.id,
          { name: room.name, icon: room.icon },
          existingRooms.length + generated.indexOf(room)
        )
        await batchAddTasks(
          room.tasks.map((t) => ({
            houseId: selectedHouse.id,
            seasonId: activeSeason.id,
            roomId,
            title: t.title,
            description: t.description,
            estimatedMinutes: t.estimatedMinutes,
            priority: t.priority,
            required: t.required,
            source: 'ai' as const,
          }))
        )
      }
      toast('חדרים ומשימות נוצרו בהצלחה! 🎉', 'success')
      navigate('/')
    } catch {
      toast('שגיאה בשמירה', 'error')
    }
    setSaving(false)
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-muted">צרו עונה פעילה כדי להשתמש ב-AI</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary-600" size={20} />
          <h2 className="text-xl font-bold">יצירה עם AI</h2>
        </div>
      </div>

      {step === 'input' && (
        <div className="space-y-4">
          <p className="text-on-surface-muted text-sm">
            תארו את הבית שלכם וה-AI ייצור רשימת חדרים ומשימות ניקיון לפסח
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="לדוגמה: דירת 4 חדרים, מטבח גדול עם הרבה ארונות, 2 חדרי שינה, סלון, מרפסת, חדר אמבטיה ושירותים נפרדים, מחסן..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 resize-none h-40"
          />

          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Wand2 size={18} />
            יצירת תוכנית
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div className="text-center py-16">
          <Loader2 size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">ה-AI מייצר את התוכנית...</p>
          <p className="text-sm text-on-surface-muted mt-1">זה עשוי לקחת כמה שניות</p>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-muted">
            בדקו את התוכנית ולחצו אישור כדי להוסיף את החדרים והמשימות
          </p>

          <AIPreviewList rooms={generated} onChange={setGenerated} />

          <div className="flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="flex-1 bg-gray-100 text-on-surface-muted py-3 rounded-xl font-medium"
            >
              חזרה
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-[2] bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              אישור ושמירה
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
