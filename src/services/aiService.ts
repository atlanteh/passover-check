import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'
import type { AIGeneratedRoom } from '../types'

interface GenerateRequest {
  description: string
  existingRooms?: string[]
}

export async function generateRoomsAndTasks(description: string, existingRooms?: string[]): Promise<AIGeneratedRoom[]> {
  const fn = httpsCallable<GenerateRequest, { rooms: AIGeneratedRoom[] }>(
    functions,
    'passoverGenerateTasks'
  )
  const result = await fn({ description, existingRooms })
  return result.data.rooms
}
