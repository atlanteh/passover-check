import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Settings } from 'lucide-react'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="פסח צ׳ק" className="w-7 h-7" />
          <h1 className="text-lg font-bold text-primary-700">פסח צ׳ק</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-on-surface-muted hover:text-primary-600 transition-colors">
            <Settings size={20} />
          </Link>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </header>
  )
}
