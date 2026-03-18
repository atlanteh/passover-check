import { useEffect, useRef, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Room } from '../types'

const RETRY_DELAY = 3000
const MAX_RETRIES = 5

export function useRooms(houseId: string | undefined) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)

  useEffect(() => {
    if (!houseId) {
      setRooms([])
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function subscribe() {
      const q = query(
        collection(db, 'rooms'),
        where('houseId', '==', houseId),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        retryCount.current = 0
        setRooms(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Room))
        setLoading(false)
      }, (error) => {
        console.error('rooms snapshot error:', error)
        setLoading(false)
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++
          retryTimer = setTimeout(subscribe, RETRY_DELAY)
        }
      })
    }

    subscribe()

    return () => {
      unsubscribe?.()
      clearTimeout(retryTimer)
    }
  }, [houseId])

  return { rooms, loading }
}
