import { useState } from 'react'
import { ROOM_ICONS, ROOM_NAME_SUGGESTIONS } from '../../types'
import type { RoomFormData } from '../../types'
import HebrewDateLabel from '../common/HebrewDateLabel'

interface RoomFormProps {
  initial?: RoomFormData
  onSubmit: (data: RoomFormData) => void
  onCancel: () => void
}

export default function RoomForm({ initial, onSubmit, onCancel }: RoomFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'other')
  const [minDate, setMinDate] = useState(initial?.minDate ?? '')
  const [showIconPicker, setShowIconPicker] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon, minDate: minDate || undefined })
  }

  function handleSuggestion(suggestion: { name: string; icon: string }) {
    setName(suggestion.name)
    setIcon(suggestion.icon)
  }

  const selectedEmoji = ROOM_ICONS[icon] ?? '📍'

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        {/* Name + icon on one line */}
        <div className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className="shrink-0 w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
            title="בחירת אייקון"
          >
            {selectedEmoji}
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5"
            placeholder="שם החדר"
            required
            autoFocus
          />
        </div>

        {/* Suggestions - one scrollable line */}
        {!initial && (
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {ROOM_NAME_SUGGESTIONS.map((s) => (
              <button
                key={s.icon}
                type="button"
                onClick={() => handleSuggestion(s)}
                className={`whitespace-nowrap text-xs px-2.5 py-1 rounded-full transition-colors shrink-0 ${
                  name === s.name
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-on-surface-muted hover:bg-gray-200'
                }`}
              >
                {ROOM_ICONS[s.icon]} {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Min date */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-on-surface-muted whitespace-nowrap">לא לפני:</label>
          <input
            type="date"
            value={minDate}
            onChange={(e) => setMinDate(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          />
          {minDate && (
            <button
              type="button"
              onClick={() => setMinDate('')}
              className="text-xs text-on-surface-muted hover:text-danger-500"
            >
              נקה
            </button>
          )}
        </div>
        {minDate && (
          <div className="mr-16">
            <HebrewDateLabel dateStr={minDate} />
          </div>
        )}

        {/* Actions on one line */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-gray-100 text-on-surface-muted font-medium"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-lg bg-primary-600 text-white font-medium disabled:opacity-50"
          >
            {initial ? 'עדכון' : 'הוספה'}
          </button>
        </div>
      </form>

      {/* Icon picker popup */}
      {showIconPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowIconPicker(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-t-2xl p-4 w-full max-w-lg animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            <h3 className="font-semibold mb-3 text-center">בחירת אייקון</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(ROOM_ICONS).map(([key, emoji]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setIcon(key); setShowIconPicker(false) }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                    icon === key ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowIconPicker(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 text-on-surface-muted font-medium"
            >
              סגירה
            </button>
          </div>
        </div>
      )}
    </>
  )
}
