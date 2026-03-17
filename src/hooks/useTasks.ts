import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Task } from '../types'

export function useTasks(seasonId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seasonId) {
      setTasks([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'tasks'),
      where('seasonId', '==', seasonId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task))
      setLoading(false)
    })

    return unsubscribe
  }, [seasonId])

  return { tasks, loading }
}
