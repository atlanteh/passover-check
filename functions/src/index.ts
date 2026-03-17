import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generateTasksFromDescription } from './generateTasks'

initializeApp()

// Use named database "passover"
const db = getFirestore('passover')

export const passoverGenerateTasks = onCall(
  { region: 'europe-west1', memory: '512MiB' },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { description } = request.data as { description?: string }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      throw new HttpsError('invalid-argument', 'Description must be at least 10 characters')
    }

    // Verify user is a member of at least one house
    const memberships = await db
      .collection('houseMembers')
      .where('userId', '==', request.auth.uid)
      .limit(1)
      .get()

    if (memberships.empty) {
      throw new HttpsError('permission-denied', 'User must be a member of a house')
    }

    try {
      const rooms = await generateTasksFromDescription(description.trim())
      return { rooms }
    } catch (error) {
      console.error('AI generation error:', error)
      throw new HttpsError('internal', 'Failed to generate tasks')
    }
  }
)
