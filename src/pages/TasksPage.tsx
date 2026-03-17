import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useHouse } from '../context/HouseContext'
import { useTasks } from '../hooks/useTasks'
import { useRooms } from '../hooks/useRooms'
import TaskCard from '../components/task/TaskCard'
import { Plus, Filter, Loader2 } from 'lucide-react'

export default function TasksPage() {
  const { selectedHouse } = useHouse()
  const { activeSeason } = useSeason()
  const { tasks, loading } = useTasks(activeSeason?.id)
  const { rooms } = useRooms(selectedHouse?.id)
  const [filterRoom, setFilterRoom] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
        <p className="text-on-surface-muted">צרו עונה כדי לנהל משימות</p>
      </div>
    )
  }

  const filtered = tasks.filter((t) => {
    if (filterRoom !== 'all' && t.roomId !== filterRoom) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    skipped: tasks.filter((t) => t.status === 'skipped').length,
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">משימות</h2>
        <Link
          to="/tasks/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          חדשה
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-on-surface-muted" />
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          >
            <option value="all">כל החדרים</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {(['all', 'pending', 'in_progress', 'done', 'skipped'] as const).map((status) => {
            const labels: Record<string, string> = {
              all: 'הכל',
              pending: 'ממתינות',
              in_progress: 'בביצוע',
              done: 'הושלמו',
              skipped: 'דולגו',
            }
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-on-surface-muted hover:bg-gray-200'
                }`}
              >
                {labels[status]} ({statusCounts[status as keyof typeof statusCounts]})
              </button>
            )
          })}
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-on-surface-muted">אין משימות להצגה</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const room = rooms.find((r) => r.id === task.roomId)
            return (
              <TaskCard
                key={task.id}
                task={task}
                roomName={room?.name}
                roomIcon={room?.icon}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
