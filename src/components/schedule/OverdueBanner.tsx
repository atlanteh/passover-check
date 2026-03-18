import { AlertTriangle } from 'lucide-react'

interface OverdueBannerProps {
  count: number
  onMoveToToday: () => void
  onRedistribute: () => void
}

export default function OverdueBanner({ count, onMoveToToday, onRedistribute }: OverdueBannerProps) {
  if (count === 0) return null

  return (
    <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2 text-warning-700">
        <AlertTriangle size={18} />
        <span className="font-semibold text-sm">{count} משימות באיחור</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onMoveToToday}
          className="flex-1 bg-warning-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-warning-700 transition-colors"
        >
          העבר להיום
        </button>
        <button
          onClick={onRedistribute}
          className="flex-1 bg-white text-warning-700 border border-warning-300 py-2 rounded-lg text-sm font-medium hover:bg-warning-50 transition-colors"
        >
          חלק מחדש
        </button>
      </div>
    </div>
  )
}
