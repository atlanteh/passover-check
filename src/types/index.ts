import { Timestamp } from 'firebase/firestore'

// ── Firestore entities ──

export interface User {
  id: string
  displayName: string
  email: string
  photoURL: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface House {
  id: string
  name: string
  emoji: string
  createdBy: string
  isArchived: boolean
  assignees?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface HouseMember {
  id: string // `{houseId}_{userId}`
  houseId: string
  userId: string
  displayName: string
  role: MemberRole
  joinedAt: Timestamp
}

export interface Room {
  id: string
  houseId: string
  name: string
  icon: string
  order: number
  isActive: boolean
  minDate?: string // YYYY-MM-DD — don't schedule tasks before this date
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type SeasonStatus = 'active' | 'completed' | 'archived'

export interface Season {
  id: string
  houseId: string
  name: string
  year: number
  targetDate: Timestamp
  status: SeasonStatus
  copiedFromSeasonId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'skipped'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskSource = 'manual' | 'ai' | 'template'

export interface Task {
  id: string
  houseId: string
  seasonId: string
  roomId: string
  title: string
  description?: string
  estimatedMinutes: number
  status: TaskStatus
  required: boolean
  priority: TaskPriority
  dueAt?: Timestamp
  scheduledDate?: string // YYYY-MM-DD for client scheduling
  assignedTo?: string
  assignedToUserId?: string
  completedByUserId?: string
  completedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  source: TaskSource
  checklist?: ChecklistItem[]
}

export interface Invite {
  id: string
  houseId: string
  code: string
  createdBy: string
  role: MemberRole
  expiresAt: Timestamp
  usedBy?: string
  usedAt?: Timestamp
  isActive: boolean
}

// ── Form types ──

export interface HouseFormData {
  name: string
  emoji: string
}

export interface RoomFormData {
  name: string
  icon: string
  minDate?: string // YYYY-MM-DD — don't schedule tasks before this date
}

export interface SeasonFormData {
  name: string
  year: number
  targetDate: string // input date string
}

export interface TaskFormData {
  roomId: string
  title: string
  description: string
  estimatedMinutes: number
  required: boolean
  priority: TaskPriority
  dueAt: string
}

// ── Checklist ──

export interface ChecklistItem {
  label: string
  done: boolean
}

// ── AI types ──

export interface AIGeneratedRoom {
  name: string
  icon: string
  tasks: AIGeneratedTask[]
}

export interface AIGeneratedTask {
  title: string
  description: string
  estimatedMinutes: number
  priority: TaskPriority
  required: boolean
  checklist?: string[]
}

// ── Scheduling ──

export interface ScheduledDay {
  date: string // YYYY-MM-DD
  tasks: Task[]
  totalMinutes: number
  isPassoverEve?: boolean
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  skippedTasks: number
  pendingTasks: number
  totalMinutes: number
  completedMinutes: number
  pendingMinutes: number
  percentComplete: number
  daysRemaining: number
  isOnTrack: boolean
  dailyTargetMinutes: number
}

// ── Constants ──

export const HOUSE_EMOJIS = ['🏠', '🏡', '🏢', '🏘️', '🏰', '🏗️', '🛖', '⛪']

export const ROOM_ICONS: Record<string, string> = {
  kitchen: '🍳',
  livingRoom: '🛋️',
  bedroom: '🛏️',
  bathroom: '🚿',
  childRoom: '🧒',
  office: '💻',
  diningRoom: '🍽️',
  laundry: '🧺',
  storage: '📦',
  balcony: '🌿',
  garage: '🚗',
  entrance: '🚪',
  other: '📍',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'ממתינה',
  in_progress: 'בביצוע',
  done: 'הושלמה',
  skipped: 'דולגה',
}

export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  active: 'פעילה',
  completed: 'הושלמה',
  archived: 'בארכיון',
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'בעלים',
  editor: 'עורך',
  viewer: 'צופה',
}

export const ROOM_NAME_SUGGESTIONS = [
  { name: 'מטבח', icon: 'kitchen' },
  { name: 'סלון', icon: 'livingRoom' },
  { name: 'חדר שינה', icon: 'bedroom' },
  { name: 'חדר אמבטיה', icon: 'bathroom' },
  { name: 'חדר ילדים', icon: 'childRoom' },
  { name: 'משרד', icon: 'office' },
  { name: 'פינת אוכל', icon: 'diningRoom' },
  { name: 'מכבסה', icon: 'laundry' },
  { name: 'מחסן', icon: 'storage' },
  { name: 'מרפסת', icon: 'balcony' },
  { name: 'חניה', icon: 'garage' },
  { name: 'כניסה', icon: 'entrance' },
]
