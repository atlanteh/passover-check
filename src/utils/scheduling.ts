import type { Task, Room, Season, ScheduledDay } from '../types'
import { startOfDay, addDays, differenceInDays, toDateString } from './date'

const DEFAULT_DAILY_MINUTES = 60
/** Finish cleaning 2 days before Passover eve */
const FINISH_DAYS_BEFORE = 2

export function getTaskProgress(task: Task): { completed: number; total: number; percent: number } {
  if (task.checklist && task.checklist.length > 0) {
    const total = task.checklist.length
    const completed = task.checklist.filter((item) => item.done).length
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }
  const done = task.status === 'done' || task.status === 'skipped'
  return { completed: done ? 1 : 0, total: 1, percent: done ? 100 : 0 }
}

export function computeScheduleAssignments(
  tasks: Task[],
  season: Season,
  rooms?: Room[]
): Map<string, string> {
  const today = startOfDay(new Date())
  const targetDate = addDays(startOfDay(season.targetDate.toDate()), -FINISH_DAYS_BEFORE)
  const daysRemaining = Math.max(1, differenceInDays(targetDate, today))

  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r]))
  const kitchenRoomIds = new Set(
    (rooms ?? []).filter((r) => r.icon === 'kitchen').map((r) => r.id)
  )

  // Only unscheduled, pending/in_progress tasks
  const unscheduled = tasks.filter(
    (t) =>
      !t.scheduledDate &&
      (t.status === 'pending' || t.status === 'in_progress')
  )

  unscheduled.sort((a, b) => {
    const aIsKitchen = kitchenRoomIds.has(a.roomId) ? 1 : 0
    const bIsKitchen = kitchenRoomIds.has(b.roomId) ? 1 : 0
    if (aIsKitchen !== bIsKitchen) return aIsKitchen - bIsKitchen
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff
    return a.estimatedMinutes - b.estimatedMinutes
  })

  const totalPendingMinutes = unscheduled.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const dailyTargetMinutes = Math.max(
    DEFAULT_DAILY_MINUTES,
    Math.ceil(totalPendingMinutes / daysRemaining)
  )

  const assignments = new Map<string, string>()
  const dayMinutes = new Map<string, number>()

  let currentDay = 0

  for (const task of unscheduled) {
    const room = roomMap.get(task.roomId)
    if (room?.minDate) {
      const minDateObj = startOfDay(new Date(room.minDate + 'T00:00:00'))
      const minDayOffset = Math.max(0, differenceInDays(minDateObj, today))
      if (currentDay < minDayOffset) {
        currentDay = minDayOffset
      }
    }

    let dateStr = toDateString(addDays(today, currentDay))
    const existingMinutes = dayMinutes.get(dateStr) ?? 0

    if (existingMinutes + task.estimatedMinutes > dailyTargetMinutes && existingMinutes > 0) {
      currentDay++
      if (currentDay >= daysRemaining) currentDay = daysRemaining - 1
      dateStr = toDateString(addDays(today, currentDay))
    }

    assignments.set(task.id, dateStr)
    dayMinutes.set(dateStr, (dayMinutes.get(dateStr) ?? 0) + task.estimatedMinutes)
  }

  return assignments
}

export function scheduleTasks(tasks: Task[], season: Season, rooms?: Room[]): ScheduledDay[] {
  const today = startOfDay(new Date())
  const targetDate = addDays(startOfDay(season.targetDate.toDate()), -FINISH_DAYS_BEFORE)
  const daysRemaining = Math.max(1, differenceInDays(targetDate, today))

  // Build room lookup for minDate and kitchen ordering
  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r]))
  const kitchenRoomIds = new Set(
    (rooms ?? []).filter((r) => r.icon === 'kitchen').map((r) => r.id)
  )

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

  // Sort undated: non-kitchen first, then high priority, then shorter tasks
  undatedTasks.sort((a, b) => {
    const aIsKitchen = kitchenRoomIds.has(a.roomId) ? 1 : 0
    const bIsKitchen = kitchenRoomIds.has(b.roomId) ? 1 : 0
    if (aIsKitchen !== bIsKitchen) return aIsKitchen - bIsKitchen
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
    // Respect room minDate — skip ahead if needed
    const room = roomMap.get(task.roomId)
    if (room?.minDate) {
      const minDateObj = startOfDay(new Date(room.minDate + 'T00:00:00'))
      const minDayOffset = Math.max(0, differenceInDays(minDateObj, today))
      if (currentDay < minDayOffset) {
        currentDay = minDayOffset
        currentDayMinutes = 0
      }
    }

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
  const passoverEveStr = toDateString(season.targetDate.toDate())
  const result: ScheduledDay[] = []
  for (const [date, dayTasks] of scheduleMap) {
    result.push({
      date,
      tasks: dayTasks,
      totalMinutes: dayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
      isPassoverEve: date === passoverEveStr || undefined,
    })
  }

  result.sort((a, b) => a.date.localeCompare(b.date))
  return result
}
