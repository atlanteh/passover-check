import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { completeTask, skipTask, updateTask, updateChecklist } from '../../services/taskService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ROOM_ICONS, PRIORITY_LABELS } from '../../types'
import type { Task, TaskStatus } from '../../types'
import { CheckCircle2, Circle, SkipForward, Clock, RotateCcw, CalendarRange, User } from 'lucide-react'
import ChecklistDisplay from './ChecklistDisplay'
import { getTaskProgress } from '../../utils/scheduling'

interface TaskCardProps {
  task: Task
  roomName?: string
  roomIcon?: string
  onMove?: () => void
}

export default function TaskCard({ task, roomName, roomIcon, onMove }: TaskCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null)

  // Clear optimistic state when real status catches up
  useEffect(() => {
    setOptimisticStatus(null)
  }, [task.status])

  const displayStatus = optimisticStatus ?? task.status
  const icon = roomIcon ? (ROOM_ICONS[roomIcon] ?? '📍') : '📍'
  const isDone = displayStatus === 'done'
  const isSkipped = displayStatus === 'skipped'

  async function handleToggle() {
    if (!user) return
    try {
      if (isDone || isSkipped) {
        setOptimisticStatus('pending')
        await updateTask(task.id, { status: 'pending', completedByUserId: null, completedAt: null })
      } else {
        setOptimisticStatus('done')
        await completeTask(task.id, user.id)
        toast('משימה הושלמה! ✓', 'success')
      }
    } catch {
      setOptimisticStatus(null)
      toast('שגיאה בעדכון', 'error')
    }
  }

  async function handleSkip() {
    try {
      setOptimisticStatus('skipped')
      await skipTask(task.id)
    } catch {
      setOptimisticStatus(null)
      toast('שגיאה בעדכון', 'error')
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm flex items-start gap-3 transition-all ${
        isDone ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={handleToggle}
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
        <Link
          to={`/tasks/${task.id}/edit`}
          className="block w-full text-start"
        >
          <div className={`font-medium ${isDone ? 'line-through text-on-surface-muted' : ''}`}>
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-muted">
            <span>{icon} {roomName ?? ''}</span>
            <span className="flex items-center gap-0.5">
              <Clock size={11} />
              {task.estimatedMinutes} דק׳
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-0.5">
                <User size={11} />
                {task.assignedTo}
              </span>
            )}
            {task.priority !== 'medium' && (
              <span className={task.priority === 'high' ? 'text-danger-500' : ''}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            )}
            {task.checklist && task.checklist.length > 0 && (() => {
              const p = getTaskProgress(task)
              return <span>{p.completed}/{p.total}</span>
            })()}
          </div>
        </Link>

        {task.checklist && task.checklist.length > 0 && (
          <div className="mt-2">
            <ChecklistDisplay
              checklist={task.checklist}
              onChange={(updated) => updateChecklist(task.id, updated)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        {onMove && !isDone && !isSkipped && (
          <button
            onClick={onMove}
            className="text-on-surface-muted hover:text-primary-600"
            title="העבר ליום אחר"
          >
            <CalendarRange size={16} />
          </button>
        )}
        {!isDone && !isSkipped && (
          <button
            onClick={handleSkip}
            className="text-on-surface-muted hover:text-warning-600"
            title="דלג"
          >
            <SkipForward size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
