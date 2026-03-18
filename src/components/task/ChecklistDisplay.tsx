import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ChecklistItem } from '../../types'

interface ChecklistDisplayProps {
  checklist: ChecklistItem[]
  onChange: (checklist: ChecklistItem[]) => void
  compact?: boolean
}

export default function ChecklistDisplay({ checklist, onChange, compact = true }: ChecklistDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const completed = checklist.filter((item) => item.done).length
  const total = checklist.length

  function handleToggle(index: number) {
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    )
    onChange(updated)
  }

  if (compact && !expanded) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
        className="flex items-center gap-2 w-full text-start"
      >
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-on-surface-muted shrink-0">{completed}/{total}</span>
        <ChevronDown size={14} className="text-on-surface-muted shrink-0" />
      </button>
    )
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="space-y-1">
      <button
        onClick={() => setExpanded(false)}
        className="flex items-center gap-2 text-xs text-on-surface-muted"
      >
        <span>{completed}/{total}</span>
        {compact && <ChevronUp size={14} />}
      </button>
      {checklist.map((item, i) => (
        <label key={i} className="flex items-center gap-2 cursor-pointer py-0.5">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => handleToggle(i)}
            className="w-4 h-4 rounded accent-primary-600 shrink-0"
          />
          <span className={`text-sm ${item.done ? 'line-through text-on-surface-muted' : ''}`}>
            {item.label}
          </span>
        </label>
      ))}
    </div>
  )
}
