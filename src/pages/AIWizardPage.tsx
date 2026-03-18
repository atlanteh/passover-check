import { useRef, useState } from 'react'
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
import { Sparkles, ArrowRight, Loader2, Wand2, Mic, MicOff } from 'lucide-react'

type SpeechRecognitionEvent = Event & { results: SpeechRecognitionResultList }

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

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
  const [recording, setRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)
  const baseTextRef = useRef('')
  const audioCtxRef = useRef<AudioContext | null>(null)

  function playTone(freq: number, duration: number) {
    const ctx = audioCtxRef.current ?? new AudioContext()
    audioCtxRef.current = ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.value = 0.15
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      setInterimText('')
      playTone(440, 0.15)
      setTimeout(() => playTone(330, 0.15), 100)
      return
    }
    if (!SpeechRecognition) {
      toast('הדפדפן לא תומך בהקלטת קול', 'error')
      return
    }
    baseTextRef.current = description
    const recognition = new SpeechRecognition()
    recognition.lang = 'he-IL'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const parts: string[] = []
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result) continue
        const text = result[0]?.transcript || ''
        if (result.isFinal) {
          parts.push(text)
        } else {
          interim += text
        }
      }
      const confirmed = baseTextRef.current
        ? baseTextRef.current + ' ' + parts.join(' ')
        : parts.join(' ')
      setDescription(confirmed.trim())
      setInterimText(interim)
    }
    recognition.onerror = () => {
      setRecording(false)
      setInterimText('')
    }
    recognition.onend = () => {
      setRecording(false)
      setInterimText('')
    }
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    playTone(330, 0.15)
    setTimeout(() => playTone(440, 0.15), 100)
  }

  async function handleGenerate() {
    if (!description.trim()) return
    setStep('loading')
    try {
      const existingRoomNames = existingRooms.map((r) => r.name)
      const result = await generateRoomsAndTasks(description, existingRoomNames)
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
      let newRoomIndex = existingRooms.length
      for (const room of generated) {
        const existing = existingRooms.find((r) => r.name === room.name)
        let roomId: string
        if (existing) {
          roomId = existing.id
        } else {
          roomId = await addRoom(
            selectedHouse.id,
            { name: room.name, icon: room.icon },
            newRoomIndex++
          )
        }
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
            ...(t.checklist && t.checklist.length > 0
              ? { checklist: t.checklist.map((label) => ({ label, done: false })) }
              : {}),
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

          <div className="relative">
            <textarea
              value={interimText ? description + (description ? ' ' : '') + interimText : description}
              onChange={(e) => { setDescription(e.target.value); baseTextRef.current = e.target.value }}
              readOnly={recording}
              placeholder="לדוגמה: דירת 4 חדרים, מטבח גדול עם הרבה ארונות, 2 חדרי שינה, סלון, מרפסת, חדר אמבטיה ושירותים נפרדים, מחסן..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pb-14 resize-none h-40"
            />
            {SpeechRecognition && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute bottom-3 left-3 p-2.5 rounded-full transition-colors ${
                  recording
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {recording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
          </div>

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
