export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function differenceInDays(later: Date, earlier: Date): number {
  const diffMs = startOfDay(later).getTime() - startOfDay(earlier).getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatHebrewDate(date: Date): string {
  return new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatHebrewDateShort(date: Date): string {
  return new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function isBeforeToday(dateStr: string): boolean {
  const today = toDateString(startOfDay(new Date()))
  return dateStr < today
}

export function generateDateRange(from: Date, to: Date): string[] {
  const dates: string[] = []
  const current = startOfDay(from)
  const end = startOfDay(to)
  while (current <= end) {
    dates.push(toDateString(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString('he-IL', { weekday: 'long' })
}
