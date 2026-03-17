import { Link } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { updateSeasonStatus } from '../services/seasonService'
import { useToast } from '../context/ToastContext'
import { Plus, Calendar, CheckCircle2, Archive, Loader2 } from 'lucide-react'
import { SEASON_STATUS_LABELS } from '../types'

export default function SeasonsPage() {
  const { seasons, loading } = useSeason()
  const { toast } = useToast()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  async function handleStatusChange(seasonId: string, status: 'completed' | 'archived') {
    try {
      await updateSeasonStatus(seasonId, status)
      toast(status === 'completed' ? 'העונה הושלמה! 🎉' : 'העונה הועברה לארכיון', 'success')
    } catch {
      toast('שגיאה בעדכון עונה', 'error')
    }
  }

  const sorted = [...seasons].sort((a, b) => b.year - a.year)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">עונות</h2>
        <Link
          to="/seasons/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          עונה חדשה
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-on-surface-muted mb-3" />
          <p className="text-on-surface-muted">אין עונות עדיין</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((season) => {
            const targetDate = season.targetDate.toDate()
            return (
              <div key={season.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{season.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      season.status === 'active'
                        ? 'bg-success-50 text-success-600'
                        : season.status === 'completed'
                          ? 'bg-primary-50 text-primary-600'
                          : 'bg-gray-100 text-on-surface-muted'
                    }`}
                  >
                    {SEASON_STATUS_LABELS[season.status]}
                  </span>
                </div>
                <p className="text-sm text-on-surface-muted mb-3">
                  יעד: {targetDate.toLocaleDateString('he-IL')} · {season.year}
                </p>
                {season.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(season.id, 'completed')}
                      className="flex items-center gap-1 text-sm text-success-600 hover:text-success-700"
                    >
                      <CheckCircle2 size={14} />
                      סיום
                    </button>
                    <button
                      onClick={() => handleStatusChange(season.id, 'archived')}
                      className="flex items-center gap-1 text-sm text-on-surface-muted hover:text-on-surface"
                    >
                      <Archive size={14} />
                      ארכיון
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
