import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

  useEffect(() => {
    if (!selectedHouse) {
      setSeasons([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'seasons'),
      where('houseId', '==', selectedHouse.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Season)
      setSeasons(items)
      setLoading(false)
    })

    return unsubscribe
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
