import type { Task, Season, DashboardStats } from '../types'
import { startOfDay, differenceInDays } from './date'

export function calculateDashboardStats(tasks: Task[], season: Season): DashboardStats {
  const today = startOfDay(new Date())
  const targetDate = startOfDay(season.targetDate.toDate())
  const daysRemaining = Math.max(0, differenceInDays(targetDate, today))

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const skippedTasks = tasks.filter((t) => t.status === 'skipped').length
  const pendingTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const completedMinutes = tasks
    .filter((t) => t.status === 'done' || t.status === 'skipped')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const pendingMinutes = totalMinutes - completedMinutes

  const percentComplete =
    totalTasks === 0 ? 0 : Math.round(((completedTasks + skippedTasks) / totalTasks) * 100)

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
