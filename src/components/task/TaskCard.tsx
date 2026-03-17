import { useState } from 'react'
import { completeTask, skipTask, updateTask } from '../../services/taskService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ROOM_ICONS, PRIORITY_LABELS } from '../../types'
import type { Task } from '../../types'
import { CheckCircle2, Circle, SkipForward, Clock, RotateCcw } from 'lucide-react'

interface TaskCardProps {
  task: Task
  roomName?: string
  roomIcon?: string
}

export default function TaskCard({ task, roomName, roomIcon }: TaskCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const icon = roomIcon ? (ROOM_ICONS[roomIcon] ?? '📍') : '📍'
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'

  async function handleToggle() {
    if (!user) return
    setLoading(true)
    try {
      if (isDone || isSkipped) {
        await updateTask(task.id, { status: 'pending', completedByUserId: null, completedAt: null })
      } else {
        await completeTask(task.id, user.id)
        toast('משימה הושלמה! ✓', 'success')
      }
    } catch {
      toast('שגיאה בעדכון', 'error')
    }
    setLoading(false)
  }

  async function handleSkip() {
    setLoading(true)
    try {
      await skipTask(task.id)
    } catch {
      toast('שגיאה בעדכון', 'error')
    }
    setLoading(false)
  }

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm flex items-start gap-3 transition-all ${
        isDone ? 'opacity-60' : ''
      } ${loading ? 'pointer-events-none' : ''}`}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className="mt-0.5 shrink-0"
      >
        {isDone ? (
          <CheckCircle2 size={22} className="text-success-600" />
        ) : isSkipped ? (
          <RotateCcw size={22} className="text-on-surface-muted" />
        ) : (
          <Circle size={22} className="text-gray-300" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${isDone ? 'line-through text-on-surface-muted' : ''}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-muted">
          <span>{icon} {roomName ?? ''}</span>
          <span className="flex items-center gap-0.5">
            <Clock size={11} />
            {task.estimatedMinutes} דק׳
          </span>
          {task.priority !== 'medium' && (
            <span className={task.priority === 'high' ? 'text-danger-500' : ''}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
        </div>
      </div>

      {!isDone && !isSkipped && (
        <button
          onClick={handleSkip}
          disabled={loading}
          className="text-on-surface-muted hover:text-warning-600 shrink-0"
          title="דלג"
        >
          <SkipForward size={16} />
        </button>
      )}
    </div>
  )
}
