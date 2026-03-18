import { useMemo } from 'react'
import { useHouse } from '../context/HouseContext'
import { useSeason } from '../context/SeasonContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import { calculateDashboardStats } from '../utils/dashboard'
import { formatDate, formatHebrewDateShort, toDateString, startOfDay, isBeforeToday } from '../utils/date'
import ProgressRing from '../components/dashboard/ProgressRing'
import CountdownBadge from '../components/dashboard/CountdownBadge'
import RoomProgress from '../components/dashboard/RoomProgress'
import { Link, Navigate } from 'react-router-dom'
import { Plus, Sparkles, Calendar, Loader2, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { selectedHouse, houses, loading: houseLoading } = useHouse()
  const { activeSeason, loading: seasonLoading } = useSeason()
  const { tasks, loading: tasksLoading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { rooms } = useRooms(selectedHouse?.id)

  const todayStr = toDateString(startOfDay(new Date()))

  const { todayTasks, overdueCount, unscheduledCount } = useMemo(() => {
    const today = tasks.filter((t) => t.scheduledDate === todayStr)
    const overdue = tasks.filter(
      (t) =>
        t.scheduledDate &&
        isBeforeToday(t.scheduledDate) &&
        (t.status === 'pending' || t.status === 'in_progress')
    ).length
    const unscheduled = tasks.filter(
      (t) =>
        !t.scheduledDate &&
        (t.status === 'pending' || t.status === 'in_progress')
    ).length
    return { todayTasks: today, overdueCount: overdue, unscheduledCount: unscheduled }
  }, [tasks, todayStr])

  if (houseLoading || seasonLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (!selectedHouse || houses.length === 0) {
    return <Navigate to="/houses" replace />
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-xl font-bold mb-2">אין עונה פעילה</h2>
        <p className="text-on-surface-muted mb-6">צרו עונת ניקיונות חדשה כדי להתחיל</p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            to="/seasons/new"
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} className="inline ml-1" />
            עונה חדשה
          </Link>
          <Link
            to="/ai"
            className="bg-primary-100 text-primary-700 px-6 py-3 rounded-xl font-medium hover:bg-primary-200 transition-colors"
          >
            <Sparkles size={18} className="inline ml-1" />
            יצירה עם AI
          </Link>
        </div>
      </div>
    )
  }

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  const stats = calculateDashboardStats(tasks, activeSeason)
  const todayMinutes = todayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedHouse.emoji} {selectedHouse.name}</h2>
          <p className="text-sm text-on-surface-muted">{activeSeason.name}</p>
        </div>
        <CountdownBadge daysRemaining={stats.daysRemaining} />
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-6">
        <ProgressRing percent={stats.percentComplete} size={100} />
        <div className="flex-1 space-y-1">
          <div className="text-2xl font-bold">{stats.percentComplete}%</div>
          <div className="text-sm text-on-surface-muted">
            {stats.completedTasks} מתוך {stats.totalTasks} משימות
          </div>
          <div className={`text-sm font-medium ${stats.isOnTrack ? 'text-success-600' : 'text-warning-600'}`}>
            {stats.isOnTrack ? '✓ בזמן' : '⚠ צריך להאיץ'}
          </div>
          {stats.dailyTargetMinutes > 0 && (
            <div className="text-xs text-on-surface-muted">
              {stats.dailyTargetMinutes} דקות ליום
            </div>
          )}
        </div>
      </div>

      {/* Overdue warning */}
      {overdueCount > 0 && (
        <Link
          to="/schedule"
          className="flex items-center gap-2 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 text-warning-700"
        >
          <AlertTriangle size={18} />
          <span className="font-medium text-sm">{overdueCount} משימות באיחור</span>
        </Link>
      )}

      {/* Unscheduled indicator */}
      {unscheduledCount > 0 && (
        <Link
          to="/schedule"
          className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700"
        >
          <Calendar size={18} />
          <span className="font-medium text-sm">{unscheduledCount} משימות לא משובצות</span>
        </Link>
      )}

      {/* Today summary */}
      {todayTasks.length > 0 && (
        <Link to="/today" className="block bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-primary-600" />
            <span className="font-semibold text-primary-700">היום</span>
            <span className="text-sm text-primary-500">{formatDate(new Date())}</span>
            <span className="text-xs text-primary-400">{formatHebrewDateShort(new Date())}</span>
          </div>
          <p className="text-sm text-on-surface-muted">
            {todayTasks.length} משימות · {todayMinutes} דקות
          </p>
        </Link>
      )}

      {/* Room breakdown */}
      {rooms.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">התקדמות לפי חדר</h3>
          <div className="space-y-2">
            {rooms.filter((r) => r.isActive).map((room) => (
              <RoomProgress key={room.id} room={room} tasks={tasks} />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          to="/tasks/new"
          className="flex-1 bg-white rounded-xl p-3 shadow-sm text-center text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Plus size={18} className="inline ml-1" />
          משימה חדשה
        </Link>
        <Link
          to="/focus"
          className="flex-1 bg-primary-600 text-white rounded-xl p-3 shadow-sm text-center text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          🎯 מיקוד
        </Link>
      </div>
    </div>
  )
}
