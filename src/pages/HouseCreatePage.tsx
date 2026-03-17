import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createHouse } from '../services/houseService'
import { useToast } from '../context/ToastContext'
import { HOUSE_EMOJIS } from '../types'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function HouseCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return

    setSaving(true)
    try {
      const houseId = await createHouse({ name: name.trim(), emoji }, user)
      localStorage.setItem('passover-check-selected-house', houseId)
      toast('בית נוצר בהצלחה!', 'success')
      navigate('/')
    } catch {
      toast('שגיאה ביצירת בית', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <h2 className="text-xl font-bold">בית חדש</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <div>
          <label className="block text-sm font-medium mb-2">אימוג׳י</label>
          <div className="flex gap-2 flex-wrap">
            {HOUSE_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-colors ${
                  emoji === e ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שם הבית</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: הבית של משפחת כהן"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          יצירת בית
        </button>
      </form>
    </div>
  )
}
