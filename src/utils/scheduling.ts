import type { Task, Season, ScheduledDay } from '../types'
import { startOfDay, addDays, differenceInDays, toDateString } from './date'

const DEFAULT_DAILY_MINUTES = 60

export function scheduleTasks(tasks: Task[], season: Season): ScheduledDay[] {
  const today = startOfDay(new Date())
  const targetDate = startOfDay(season.targetDate.toDate())
  const daysRemaining = Math.max(1, differenceInDays(targetDate, today))

  // Separate tasks
  const pendingTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  )
  const doneTasks = tasks.filter((t) => t.status === 'done' || t.status === 'skipped')

  // Tasks with explicit due dates
  const datedTasks: Task[] = []
  const undatedTasks: Task[] = []

  for (const task of pendingTasks) {
    if (task.dueAt) {
      datedTasks.push(task)
    } else {
      undatedTasks.push(task)
    }
  }

  // Sort undated: high priority first, then shorter tasks
  undatedTasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff
    return a.estimatedMinutes - b.estimatedMinutes
  })

  // Calculate daily target
  const totalPendingMinutes = pendingTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const dailyTargetMinutes = Math.max(
    DEFAULT_DAILY_MINUTES,
    Math.ceil(totalPendingMinutes / daysRemaining)
  )

  // Build schedule
  const scheduleMap = new Map<string, Task[]>()

  // Place dated tasks on their due dates
  for (const task of datedTasks) {
    const dateStr = toDateString(task.dueAt!.toDate())
    if (!scheduleMap.has(dateStr)) scheduleMap.set(dateStr, [])
    scheduleMap.get(dateStr)!.push(task)
  }

  // Distribute undated tasks across days
  let currentDay = 0
  let currentDayMinutes = 0

  for (const task of undatedTasks) {
    const dateStr = toDateString(addDays(today, currentDay))

    // Check how much time is already booked on this day
    const existing = scheduleMap.get(dateStr) ?? []
    const existingMinutes = existing.reduce((sum, t) => sum + t.estimatedMinutes, 0)
    currentDayMinutes = existingMinutes

    if (currentDayMinutes + task.estimatedMinutes > dailyTargetMinutes && currentDayMinutes > 0) {
      currentDay++
      if (currentDay >= daysRemaining) currentDay = daysRemaining - 1
      currentDayMinutes = 0
    }

    const newDateStr = toDateString(addDays(today, currentDay))
    if (!scheduleMap.has(newDateStr)) scheduleMap.set(newDateStr, [])
    scheduleMap.get(newDateStr)!.push(task)
    currentDayMinutes += task.estimatedMinutes
  }

  // Also include completed tasks on today for display
  const todayStr = toDateString(today)
  const todayDoneTasks = doneTasks.filter((t) => {
    if (t.completedAt) {
      return toDateString(t.completedAt.toDate()) === todayStr
    }
    return false
  })
  if (todayDoneTasks.length > 0) {
    if (!scheduleMap.has(todayStr)) scheduleMap.set(todayStr, [])
    scheduleMap.get(todayStr)!.push(...todayDoneTasks)
  }

  // Convert to sorted array
  const result: ScheduledDay[] = []
  for (const [date, dayTasks] of scheduleMap) {
    result.push({
      date,
      tasks: dayTasks,
      totalMinutes: dayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    })
  }

  result.sort((a, b) => a.date.localeCompare(b.date))
  return result
}
