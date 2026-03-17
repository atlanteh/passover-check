import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { redeemInvite } from '../services/inviteService'
import { useToast } from '../context/ToastContext'
import { ArrowRight, Loader2, UserPlus } from 'lucide-react'

export default function JoinHousePage() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [code, setCode] = useState(urlCode ?? '')
  const [joining, setJoining] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !code.trim()) return

    setJoining(true)
    try {
      const houseId = await redeemInvite(code.trim().toUpperCase(), user)
      localStorage.setItem('passover-check-selected-house', houseId)
      toast('הצטרפת לבית בהצלחה! 🎉', 'success')
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בהצטרפות'
      toast(message, 'error')
    }
    setJoining(false)
  }

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-on-surface-muted">
          <ArrowRight size={20} />
        </button>
        <h2 className="text-xl font-bold">הצטרפות לבית</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
        <div className="text-center mb-6">
          <UserPlus size={48} className="mx-auto text-primary-500 mb-3" />
          <p className="text-on-surface-muted">הזינו את קוד ההזמנה שקיבלתם</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">קוד הזמנה</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono"
            maxLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={joining || code.length < 6}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {joining ? <Loader2 size={18} className="animate-spin" /> : null}
          הצטרפות
        </button>
      </form>
    </div>
  )
}
