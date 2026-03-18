import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Room, RoomFormData } from '../types'

export async function addRoom(
  houseId: string,
  data: RoomFormData,
  order: number
): Promise<string> {
  const ref = await addDoc(collection(db, 'rooms'), {
    houseId,
    name: data.name,
    icon: data.icon,
    order,
    isActive: true,
    minDate: data.minDate || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRoom(roomId: string, data: Partial<RoomFormData>) {
  const { minDate, ...rest } = data
  await updateDoc(doc(db, 'rooms', roomId), {
    ...rest,
    minDate: minDate || null,
    updatedAt: serverTimestamp(),
  })
}

export async function reorderRooms(rooms: Room[], fromIndex: number, toIndex: number) {
  const reordered = [...rooms]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved!)

  const batch = writeBatch(db)
  reordered.forEach((room, i) => {
    batch.update(doc(db, 'rooms', room.id), { order: i })
  })
  await batch.commit()
}
