import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import { useSeason } from '../context/SeasonContext'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Home, Users, Calendar, Sparkles, ChevronLeft,
  DoorOpen,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { selectedHouse, houses } = useHouse()
  const { activeSeason } = useSeason()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
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
