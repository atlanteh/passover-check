import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHouse } from '../context/HouseContext'
import { createSeason } from '../services/seasonService'
import { useToast } from '../context/ToastContext'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function SeasonCreatePage() {
  const navigate = useNavigate()
  const { selectedHouse } = useHouse()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const currentYear = new Date().getFullYear()
  const [name, setName] = useState(`פסח ${currentYear}`)
  const [year, setYear] = useState(currentYear)
  const [targetDate, setTargetDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHouse || !targetDate) return

    setSaving(true)
    try {
      await createSeason({
        houseId: selectedHouse.id,
        name,
        year,
        targetDate,
      })
      toast('עונה נוצרה בהצלחה', 'success')
      navigate('/')
    } catch {
      toast('שגיאה ביצירת עונה', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <h2 className="text-xl font-bold">עונה חדשה</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">שם העונה</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שנה</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            min={2024}
            max={2030}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">תאריך יעד (ליל הסדר)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim() || !targetDate}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          יצירת עונה
        </button>
      </form>
    </div>
  )
}
