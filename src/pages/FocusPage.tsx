import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useHouse } from '../context/HouseContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import { toDateString, startOfDay } from '../utils/date'
import { completeTask, skipTask } from '../services/taskService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Target, CheckCircle2, SkipForward, Loader2, PartyPopper, CalendarRange } from 'lucide-react'
import { ROOM_ICONS, PRIORITY_LABELS } from '../types'

export default function FocusPage() {
  const { user } = useAuth()
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { tasks, loading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { rooms } = useRooms(selectedHouse?.id)
  const { toast } = useToast()
  const [completing, setCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  const todayStr = toDateString(startOfDay(new Date()))

  const { pendingTasks, hasAnyScheduled } = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr)
    const pending = todayTasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    )
    const anyScheduled = tasks.some((t) => t.scheduledDate)
    return { pendingTasks: pending, hasAnyScheduled: anyScheduled }
  }, [tasks, todayStr])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-20">
        <Target size={48} className="mx-auto text-on-surface-muted mb-3" />
        <p className="text-on-surface-muted">אין עונה פעילה</p>
      </div>
    )
  }

  if (!hasAnyScheduled && tasks.length > 0) {
    return (
      <div className="text-center py-20">
        <CalendarRange size={48} className="mx-auto text-on-surface-muted mb-3" />
        <h3 className="text-lg font-semibold mb-1">לא שובצו משימות</h3>
        <p className="text-on-surface-muted mb-4">לכו ללו״ז לשיבוץ משימות</p>
        <Link
          to="/schedule"
          className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium inline-block"
        >
          ללו״ז
        </Link>
      </div>
    )
  }

  const currentTask = pendingTasks[0] as typeof pendingTasks[number] | undefined

  if (!currentTask || justCompleted) {
    const allDone = pendingTasks.length === 0 && !justCompleted
    return (
      <div className="text-center py-20 animate-bounce-in">
        <PartyPopper size={64} className="mx-auto text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {justCompleted ? 'כל הכבוד!' : 'סיימת להיום!'}
        </h2>
        <p className="text-on-surface-muted">
          {allDone ? 'אין עוד משימות להיום, מגיע לך הפסקה' : 'משימה הושלמה בהצלחה!'}
        </p>
        {justCompleted && pendingTasks.length > 0 && (
          <button
            onClick={() => setJustCompleted(false)}
            className="mt-6 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            למשימה הבאה ({pendingTasks.length} נותרו)
          </button>
        )}
      </div>
    )
  }

  const room = rooms.find((r) => r.id === currentTask.roomId)
  const roomIcon = room?.icon ? (ROOM_ICONS[room.icon] ?? '📍') : '📍'

  async function handleComplete() {
    if (!user || !currentTask) return
    setCompleting(true)
    try {
      await completeTask(currentTask.id, user.id)
      setJustCompleted(true)
      toast('משימה הושלמה! 🎉', 'success')
      setTimeout(() => setJustCompleted(false), 2000)
    } catch {
      toast('שגיאה בעדכון המשימה', 'error')
    }
    setCompleting(false)
  }

  async function handleSkip() {
    if (!currentTask) return
    try {
      await skipTask(currentTask.id)
      toast('משימה דולגה', 'info')
    } catch {
      toast('שגיאה בעדכון המשימה', 'error')
    }
  }

  return (
    <div className="flex flex-col items-center py-8 animate-scale-in">
      <Target size={32} className="text-primary-600 mb-2" />
      <h2 className="text-lg font-bold text-primary-700 mb-1">מצב מיקוד</h2>
      <p className="text-sm text-on-surface-muted mb-8">
        {pendingTasks.length} משימות נותרו להיום
      </p>

      {/* Task card */}
      <div className="w-full bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-on-surface-muted">
          <span className="text-xl">{roomIcon}</span>
          <span>{room?.name ?? 'לא משויך'}</span>
        </div>

        <h3 className="text-xl font-bold">{currentTask.title}</h3>

        {currentTask.description && (
          <p className="text-on-surface-muted text-sm">{currentTask.description}</p>
        )}

        <div className="flex gap-3 text-sm">
          <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-lg">
            ⏱️ {currentTask.estimatedMinutes} דק׳
          </span>
          <span className="bg-gray-50 text-on-surface-muted px-2 py-1 rounded-lg">
            {PRIORITY_LABELS[currentTask.priority]}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex gap-3 mt-8">
        <button
          onClick={handleSkip}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-on-surface-muted rounded-xl py-4 font-medium hover:bg-gray-200 transition-colors"
        >
          <SkipForward size={18} />
          דלג
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex-[2] flex items-center justify-center gap-2 bg-success-600 text-white rounded-xl py-4 font-semibold hover:bg-success-500 transition-colors disabled:opacity-50"
        >
          {completing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle2 size={18} />
          )}
          סיימתי!
        </button>
      </div>
    </div>
  )
}
