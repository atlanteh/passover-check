import { formatDayOfWeek, formatHebrewDateShort } from '../../utils/date'
import { X } from 'lucide-react'

interface DayPickerModalProps {
  open: boolean
  onClose: () => void
  onSelectDate: (date: string | null) => void
  dates: string[]
  minutesByDate: Map<string, number>
  dailyTarget: number
  currentDate?: string
}

export default function DayPickerModal({
  open,
  onClose,
  onSelectDate,
  dates,
  minutesByDate,
  dailyTarget,
  currentDate,
}: DayPickerModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl w-full max-w-lg max-h-[70dvh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold">העברה ליום אחר</h3>
          <button onClick={onClose} className="text-on-surface-muted">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          <button
            onClick={() => onSelectDate(null)}
            className="w-full text-start px-4 py-3 rounded-xl hover:bg-gray-50 text-on-surface-muted"
          >
            ללא תאריך
          </button>

          {dates.map((dateStr) => {
            const date = new Date(dateStr + 'T00:00:00')
            const minutes = minutesByDate.get(dateStr) ?? 0
            const isOverloaded = minutes > dailyTarget
            const isCurrent = dateStr === currentDate

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`w-full text-start px-4 py-3 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{formatDayOfWeek(date)}</span>
                    <span className="text-sm text-on-surface-muted mr-2">
                      {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs text-on-surface-muted mr-1">
                      {formatHebrewDateShort(date)}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isOverloaded
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-gray-100 text-on-surface-muted'
                    }`}
                  >
                    {minutes} דק׳
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
