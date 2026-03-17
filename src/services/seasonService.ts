import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { SeasonStatus } from '../types'

interface CreateSeasonInput {
  houseId: string
  name: string
  year: number
  targetDate: string
}

export async function createSeason(data: CreateSeasonInput): Promise<string> {
  const ref = await addDoc(collection(db, 'seasons'), {
    houseId: data.houseId,
    name: data.name,
    year: data.year,
    targetDate: Timestamp.fromDate(new Date(data.targetDate)),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSeasonStatus(seasonId: string, status: SeasonStatus) {
  await updateDoc(doc(db, 'seasons', seasonId), {
    status,
    updatedAt: serverTimestamp(),
  })
}
