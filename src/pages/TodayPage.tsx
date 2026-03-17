import { useSeason } from '../context/SeasonContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import { useHouse } from '../context/HouseContext'
import { scheduleTasks } from '../utils/scheduling'
import { toDateString, startOfDay, formatDate } from '../utils/date'
import TaskCard from '../components/task/TaskCard'
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react'

export default function TodayPage() {
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { tasks, loading } = useTasks(activeSeason?.id)
  const { rooms } = useRooms(selectedHouse?.id)

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
        <p className="text-on-surface-muted">אין עונה פעילה</p>
      </div>
    )
  }

  const schedule = scheduleTasks(tasks, activeSeason)
  const todayStr = toDateString(startOfDay(new Date()))
  const todaySchedule = schedule.find((d) => d.date === todayStr)
  const todayTasks = todaySchedule?.tasks ?? []
  const completedToday = todayTasks.filter((t) => t.status === 'done').length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Calendar className="text-primary-600" size={24} />
        <div>
          <h2 className="text-xl font-bold">היום</h2>
          <p className="text-sm text-on-surface-muted">{formatDate(new Date())}</p>
        </div>
      </div>

      {todayTasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 size={48} className="mx-auto text-success-500 mb-3" />
          <h3 className="text-lg font-semibold mb-1">אין משימות להיום!</h3>
          <p className="text-on-surface-muted">נהדר, אפשר לנוח 🎉</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <span className="text-sm text-on-surface-muted">
              {todaySchedule!.totalMinutes} דקות · {todayTasks.length} משימות
            </span>
            <span className="text-sm font-medium text-primary-600">
              {completedToday}/{todayTasks.length} הושלמו
            </span>
          </div>

          <div className="space-y-2">
            {todayTasks.map((task) => {
              const room = rooms.find((r) => r.id === task.roomId)
              return <TaskCard key={task.id} task={task} roomName={room?.name} roomIcon={room?.icon} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
