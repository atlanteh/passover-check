import type { Task, Season, DashboardStats } from '../types'
import { startOfDay, addDays, differenceInDays } from './date'
import { getTaskProgress } from './scheduling'

/** Finish cleaning 2 days before Passover eve */
const FINISH_DAYS_BEFORE = 2

export function calculateDashboardStats(tasks: Task[], season: Season): DashboardStats {
  const today = startOfDay(new Date())
  const targetDate = addDays(startOfDay(season.targetDate.toDate()), -FINISH_DAYS_BEFORE)
  const daysRemaining = Math.max(0, differenceInDays(targetDate, today))

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const skippedTasks = tasks.filter((t) => t.status === 'skipped').length
  const pendingTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)

  // Factor in checklist progress for partial completion
  let completedMinutes = 0
  for (const task of tasks) {
    if (task.status === 'done' || task.status === 'skipped') {
      completedMinutes += task.estimatedMinutes
    } else {
      const progress = getTaskProgress(task)
      if (progress.total > 1) {
        completedMinutes += Math.round(task.estimatedMinutes * (progress.percent / 100))
      }
    }
  }
  const pendingMinutes = totalMinutes - completedMinutes

  const percentComplete =
    totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100)

  const dailyTargetMinutes =
    daysRemaining > 0 ? Math.ceil(pendingMinutes / daysRemaining) : pendingMinutes

  // On track if we're completing at the expected rate
  const totalDays = differenceInDays(targetDate, season.createdAt.toDate())
  const daysElapsed = totalDays - daysRemaining
  const expectedPercent = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0
  const isOnTrack = percentComplete >= expectedPercent - 10 // 10% grace

  return {
    totalTasks,
    completedTasks,
    skippedTasks,
    pendingTasks,
    totalMinutes,
    completedMinutes,
    pendingMinutes,
    percentComplete,
    daysRemaining,
    isOnTrack,
    dailyTargetMinutes,
  }
}
