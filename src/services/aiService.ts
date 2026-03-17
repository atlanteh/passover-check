import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'
import type { AIGeneratedRoom } from '../types'

export async function generateRoomsAndTasks(description: string): Promise<AIGeneratedRoom[]> {
  const fn = httpsCallable<{ description: string }, { rooms: AIGeneratedRoom[] }>(
    functions,
    'passoverGenerateTasks'
  )
  const result = await fn({ description })
  return result.data.rooms
}
