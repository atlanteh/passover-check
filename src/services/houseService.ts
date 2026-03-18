import { doc, writeBatch, serverTimestamp, collection, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { User, HouseFormData } from '../types'

export async function createHouse(data: HouseFormData, user: User): Promise<string> {
  const batch = writeBatch(db)

  const houseRef = doc(collection(db, 'houses'))
  batch.set(houseRef, {
    name: data.name,
    emoji: data.emoji,
    createdBy: user.id,
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const memberRef = doc(db, 'houseMembers', `${houseRef.id}_${user.id}`)
  batch.set(memberRef, {
    houseId: houseRef.id,
    userId: user.id,
    displayName: user.displayName,
    role: 'owner',
    joinedAt: serverTimestamp(),
  })

  await batch.commit()
  return houseRef.id
}

export async function updateHouse(houseId: string, data: Partial<HouseFormData>) {
  const houseRef = doc(db, 'houses', houseId)
  await updateDoc(houseRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateHouseAssignees(houseId: string, assignees: string[]) {
  const houseRef = doc(db, 'houses', houseId)
  await updateDoc(houseRef, {
    assignees,
    updatedAt: serverTimestamp(),
  })
}
