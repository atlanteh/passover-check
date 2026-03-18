import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import { useSeason } from '../context/SeasonContext'
import { updateHouseAssignees } from '../services/houseService'
import { useToast } from '../context/ToastContext'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Home, Users, Calendar, Sparkles, ChevronLeft,
  DoorOpen, Plus, X,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { selectedHouse, houses } = useHouse()
  const { activeSeason } = useSeason()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [newAssignee, setNewAssignee] = useState('')

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleAddAssignee() {
    const name = newAssignee.trim()
    if (!name || !selectedHouse) return
    const current = selectedHouse.assignees ?? []
    if (current.includes(name)) {
      toast('השם כבר קיים', 'error')
      return
    }
    try {
      await updateHouseAssignees(selectedHouse.id, [...current, name])
      setNewAssignee('')
    } catch {
      toast('שגיאה בהוספת משתתף', 'error')
    }
  }

  async function handleRemoveAssignee(name: string) {
    if (!selectedHouse) return
    const current = selectedHouse.assignees ?? []
    try {
      await updateHouseAssignees(selectedHouse.id, current.filter((a) => a !== name))
    } catch {
      toast('שגיאה בהסרת משתתף', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold">הגדרות</h2>

      {/* Profile */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-12 h-12 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg">
            {user?.displayName?.charAt(0) ?? '?'}
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold">{user?.displayName}</div>
          <div className="text-sm text-on-surface-muted">{user?.email}</div>
        </div>
      </div>

      {/* House info */}
      {selectedHouse && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          <div className="p-4">
            <h3 className="font-semibold mb-1">{selectedHouse.emoji} {selectedHouse.name}</h3>
            {activeSeason && (
              <p className="text-sm text-on-surface-muted">עונה: {activeSeason.name}</p>
            )}
          </div>

          <SettingsLink to="/houses" icon={<Home size={18} />} label="החלפת בית" />
          <SettingsLink to="/rooms" icon={<DoorOpen size={18} />} label="ניהול חדרים" />
          <SettingsLink to="/seasons" icon={<Calendar size={18} />} label="עונות" />
          <SettingsLink to="/invite" icon={<Users size={18} />} label="הזמנת חברים" />
          <SettingsLink to="/ai" icon={<Sparkles size={18} />} label="יצירה עם AI" />
        </div>
      )}

      {/* Assignees */}
      {selectedHouse && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users size={18} className="text-on-surface-muted" />
            משתתפים
          </h3>
          <div className="flex flex-wrap gap-2">
            {(selectedHouse.assignees ?? []).map((name) => (
              <span
                key={name}
                className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
              >
                {name}
                <button
                  onClick={() => handleRemoveAssignee(name)}
                  className="hover:text-danger-500"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAssignee() } }}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="הוספת שם..."
            />
            <button
              onClick={handleAddAssignee}
              disabled={!newAssignee.trim()}
              className="bg-primary-600 text-white px-3 py-2 rounded-xl hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Houses */}
      {houses.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-on-surface-muted">בתים נוספים</h3>
          </div>
          {houses
            .filter((h) => h.id !== selectedHouse?.id)
            .map((house) => (
              <button
                key={house.id}
                onClick={() => {
                  localStorage.setItem('passover-check-selected-house', house.id)
                  window.location.reload()
                }}
                className="w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100"
              >
                <span className="text-xl">{house.emoji}</span>
                <span className="flex-1 font-medium">{house.name}</span>
                <ChevronLeft size={16} className="text-on-surface-muted" />
              </button>
            ))}
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 text-danger-600 py-3 font-medium"
      >
        <LogOut size={18} />
        התנתקות
      </button>
    </div>
  )
}

function SettingsLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <span className="text-on-surface-muted">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronLeft size={16} className="text-on-surface-muted" />
    </Link>
  )
}
