import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Room } from '../types'

export function useRooms(houseId: string | undefined) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!houseId) {
      setRooms([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'rooms'),
      where('houseId', '==', houseId),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Room))
      setLoading(false)
    })

    return unsubscribe
  }, [houseId])

  return { rooms, loading }
}
