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
  const { tasks, loading } = useTasks(activeSeason?.id, selectedHouse?.id)
  const { rooms } = useRooms(selectedHouse?.id)
  const [filterRoom, setFilterRoom] = useState<string>(() => sessionStorage.getItem('tasks-filter-room') ?? 'all')
  const [filterAssignee, setFilterAssignee] = useState<string>(() => sessionStorage.getItem('tasks-filter-assignee') ?? 'all')
  const [filterStatus, setFilterStatus] = useState<string>(() => sessionStorage.getItem('tasks-filter-status') ?? 'all')

  function handleFilterRoom(value: string) {
    setFilterRoom(value)
    sessionStorage.setItem('tasks-filter-room', value)
  }

  function handleFilterAssignee(value: string) {
    setFilterAssignee(value)
    sessionStorage.setItem('tasks-filter-assignee', value)
  }

  function handleFilterStatus(value: string) {
    setFilterStatus(value)
    sessionStorage.setItem('tasks-filter-status', value)
  }

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
    if (filterAssignee !== 'all') {
      if (filterAssignee === '_unassigned') {
        if (t.assignedTo) return false
      } else if (t.assignedTo !== filterAssignee) {
        return false
      }
    }
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
            onChange={(e) => handleFilterRoom(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          >
            <option value="all">כל החדרים</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {selectedHouse?.assignees && selectedHouse.assignees.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => handleFilterAssignee(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
            >
              <option value="all">כולם</option>
              <option value="_unassigned">ללא משויך</option>
              {selectedHouse.assignees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
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
                onClick={() => handleFilterStatus(status)}
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
