import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Target, ListTodo, CalendarRange } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'ראשי' },
  { to: '/today', icon: CalendarCheck, label: 'היום' },
  { to: '/focus', icon: Target, label: 'מיקוד', elevated: true },
  { to: '/tasks', icon: ListTodo, label: 'משימות' },
  { to: '/schedule', icon: CalendarRange, label: 'לו"ז' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-end justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                item.elevated ? '-mt-4' : ''
              } ${
                isActive
                  ? 'text-primary-600'
                  : 'text-on-surface-muted hover:text-primary-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.elevated ? (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                      isActive ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                    }`}
                  >
                    <item.icon size={22} />
                  </div>
                ) : (
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                )}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
