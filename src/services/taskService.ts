import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { TaskPriority, TaskSource, ChecklistItem } from '../types'

interface AddTaskInput {
  houseId: string
  seasonId: string
  roomId: string
  title: string
  description?: string
  estimatedMinutes: number
  required: boolean
  priority: TaskPriority
  dueAt?: string
  source?: TaskSource
  checklist?: ChecklistItem[]
  assignedTo?: string
}

export async function addTask(data: AddTaskInput): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    houseId: data.houseId,
    seasonId: data.seasonId,
    roomId: data.roomId,
    title: data.title,
    description: data.description || null,
    estimatedMinutes: data.estimatedMinutes,
    status: 'pending',
    required: data.required,
    priority: data.priority,
    dueAt: data.dueAt ? Timestamp.fromDate(new Date(data.dueAt)) : null,
    assignedTo: data.assignedTo || null,
    assignedToUserId: null,
    completedByUserId: null,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: data.source || 'manual',
    ...(data.checklist && data.checklist.length > 0 ? { checklist: data.checklist } : {}),
  })
  return ref.id
}

export async function completeTask(taskId: string, userId: string) {
  await updateDoc(doc(db, 'tasks', taskId), {
    status: 'done',
    completedByUserId: userId,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function skipTask(taskId: string) {
  await updateDoc(doc(db, 'tasks', taskId), {
    status: 'skipped',
    updatedAt: serverTimestamp(),
  })
}

export async function updateTask(taskId: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function setTaskScheduledDate(taskId: string, scheduledDate: string | null) {
  await updateDoc(doc(db, 'tasks', taskId), {
    scheduledDate: scheduledDate ?? null,
    updatedAt: serverTimestamp(),
  })
}

export async function batchUpdateScheduledDates(
  updates: { taskId: string; scheduledDate: string | null }[]
) {
  // Firestore batches limited to 500
  for (let i = 0; i < updates.length; i += 500) {
    const chunk = updates.slice(i, i + 500)
    const batch = writeBatch(db)
    for (const { taskId, scheduledDate } of chunk) {
      batch.update(doc(db, 'tasks', taskId), {
        scheduledDate: scheduledDate ?? null,
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
  }
}

export async function updateChecklist(taskId: string, checklist: ChecklistItem[]) {
  await updateDoc(doc(db, 'tasks', taskId), {
    checklist,
    updatedAt: serverTimestamp(),
  })
}

interface BatchTaskInput {
  houseId: string
  seasonId: string
  roomId: string
  title: string
  description?: string
  estimatedMinutes: number
  priority: TaskPriority
  required: boolean
  source: TaskSource
  checklist?: ChecklistItem[]
  assignedTo?: string
}

export async function batchAddTasks(tasks: BatchTaskInput[]) {
  const batch = writeBatch(db)

  for (const task of tasks) {
    const ref = doc(collection(db, 'tasks'))
    batch.set(ref, {
      houseId: task.houseId,
      seasonId: task.seasonId,
      roomId: task.roomId,
      title: task.title,
      description: task.description || null,
      estimatedMinutes: task.estimatedMinutes,
      status: 'pending',
      required: task.required,
      priority: task.priority,
      dueAt: null,
      assignedTo: task.assignedTo || null,
      assignedToUserId: null,
      completedByUserId: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: task.source,
      ...(task.checklist ? { checklist: task.checklist } : {}),
    })
  }

  await batch.commit()
}
