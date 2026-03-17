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
import type { TaskPriority, TaskSource } from '../types'

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
    assignedToUserId: null,
    completedByUserId: null,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: data.source || 'manual',
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
      assignedToUserId: null,
      completedByUserId: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: task.source,
    })
  }

  await batch.commit()
}
