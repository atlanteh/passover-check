import { formatHebrewDateShort } from '../../utils/date'

interface HebrewDateLabelProps {
  dateStr: string // YYYY-MM-DD
}

export default function HebrewDateLabel({ dateStr }: HebrewDateLabelProps) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00')
  return (
    <span className="text-xs text-on-surface-muted">{formatHebrewDateShort(date)}</span>
  )
}
