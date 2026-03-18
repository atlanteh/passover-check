import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useHouse } from './HouseContext'
import type { Season } from '../types'

interface SeasonContextValue {
  seasons: Season[]
  activeSeason: Season | null
  loading: boolean
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { selectedHouse } = useHouse()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)

  const retryCount = useRef(0)
  useEffect(() => {
    if (!selectedHouse) {
      setSeasons([])
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function subscribe() {
      const q = query(
        collection(db, 'seasons'),
        where('houseId', '==', selectedHouse!.id)
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        retryCount.current = 0
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Season)
        setSeasons(items)
        setLoading(false)
      }, (error) => {
        console.error('seasons snapshot error:', error)
        setLoading(false)
        if (retryCount.current < 5) {
          retryCount.current++
          retryTimer = setTimeout(subscribe, 3000)
        }
      })
    }

    subscribe()

    return () => {
      unsubscribe?.()
      clearTimeout(retryTimer)
    }
  }, [selectedHouse])

  const activeSeason = seasons.find((s) => s.status === 'active') ?? null

  return (
    <SeasonContext.Provider value={{ seasons, activeSeason, loading }}>
      {children}
    </SeasonContext.Provider>
  )
}

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider')
  return ctx
}
