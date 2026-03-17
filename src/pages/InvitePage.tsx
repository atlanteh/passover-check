import { useEffect, useState } from 'react'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import { createInvite, getActiveInvites } from '../services/inviteService'
import { useToast } from '../context/ToastContext'
import type { Invite, MemberRole } from '../types'
import { Copy, Plus, Loader2, Share2 } from 'lucide-react'

export default function InvitePage() {
  const { selectedHouse } = useHouse()
  const { user } = useAuth()
  const { toast } = useToast()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [role, setRole] = useState<MemberRole>('editor')

  useEffect(() => {
    if (!selectedHouse) return
    loadInvites()
  }, [selectedHouse])

  async function loadInvites() {
    if (!selectedHouse) return
    setLoading(true)
    try {
      const items = await getActiveInvites(selectedHouse.id)
      setInvites(items)
    } catch {
      toast('שגיאה בטעינת הזמנות', 'error')
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!selectedHouse || !user) return
    setCreating(true)
    try {
      await createInvite(selectedHouse.id, user.id, role)
      await loadInvites()
      toast('הזמנה נוצרה!', 'success')
    } catch {
      toast('שגיאה ביצירת הזמנה', 'error')
    }
    setCreating(false)
  }

  function copyCode(code: string) {
    const url = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(url)
    toast('הקישור הועתק!', 'success')
  }

  function shareCode(code: string) {
    const url = `${window.location.origin}/join/${code}`
    if (navigator.share) {
      navigator.share({ title: 'הזמנה לפסח צ׳ק', text: 'הצטרפו לבית שלנו!', url })
    } else {
      copyCode(code)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">הזמנת חברים</h2>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">תפקיד</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="editor">עורך (יכול לערוך משימות)</option>
            <option value="viewer">צופה (צפייה בלבד)</option>
          </select>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          יצירת הזמנה
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : invites.length === 0 ? (
        <p className="text-center text-on-surface-muted py-8">אין הזמנות פעילות</p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => (
            <div key={invite.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="flex-1">
                <div className="font-mono text-lg font-bold tracking-widest">{invite.code}</div>
                <p className="text-xs text-on-surface-muted">
                  {invite.role === 'editor' ? 'עורך' : 'צופה'} ·
                  {invite.usedBy ? ' נוצל' : ' פעיל'}
                </p>
              </div>
              {!invite.usedBy && (
                <div className="flex gap-2">
                  <button
                    onClick={() => copyCode(invite.code)}
                    className="p-2 text-on-surface-muted hover:text-primary-600 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => shareCode(invite.code)}
                    className="p-2 text-on-surface-muted hover:text-primary-600 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
