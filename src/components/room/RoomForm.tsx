import { useState } from 'react'
import { ROOM_ICONS, ROOM_NAME_SUGGESTIONS } from '../../types'
import type { RoomFormData } from '../../types'

interface RoomFormProps {
  initial?: RoomFormData
  onSubmit: (data: RoomFormData) => void
  onCancel: () => void
}

export default function RoomForm({ initial, onSubmit, onCancel }: RoomFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'other')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon })
  }

  function handleSuggestion(suggestion: { name: string; icon: string }) {
    setName(suggestion.name)
    setIcon(suggestion.icon)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">שם החדר</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
          placeholder="שם החדר"
          required
          autoFocus
        />
      </div>

      {!initial && (
        <div className="flex flex-wrap gap-2">
          {ROOM_NAME_SUGGESTIONS.map((s) => (
            <button
              key={s.icon}
              type="button"
              onClick={() => handleSuggestion(s)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
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

      <div>
        <label className="block text-sm font-medium mb-1">אייקון</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROOM_ICONS).map(([key, emoji]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                icon === key ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

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
  )
}
