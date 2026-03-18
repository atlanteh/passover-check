import { useEffect, useRef, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Task } from '../types'

const RETRY_DELAY = 3000
const MAX_RETRIES = 5

export function useTasks(seasonId: string | undefined, houseId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)

  useEffect(() => {
    if (!seasonId || !houseId) {
      setTasks([])
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function subscribe() {
      const q = query(
        collection(db, 'tasks'),
        where('houseId', '==', houseId),
        where('seasonId', '==', seasonId)
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        retryCount.current = 0
        setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task))
        setLoading(false)
      }, (error) => {
        console.error('tasks snapshot error:', error)
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
  }, [seasonId])

  return { tasks, loading }
}
