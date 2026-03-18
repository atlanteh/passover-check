import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import type { House, HouseMember } from '../types'

interface HouseContextValue {
  houses: House[]
  memberships: HouseMember[]
  selectedHouse: House | null
  selectHouse: (houseId: string) => void
  loading: boolean
}

const HouseContext = createContext<HouseContextValue | null>(null)

const SELECTED_HOUSE_KEY = 'passover-check-selected-house'

export function HouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<HouseMember[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_HOUSE_KEY)
  )
  const [loading, setLoading] = useState(true)

  // Listen to memberships
  const retryCount = useRef(0)
  const houseUnsubs = useRef<(() => void)[]>([])

  useEffect(() => {
    if (!user) {
      setMemberships([])
      setHouses([])
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function subscribe() {
      const q = query(
        collection(db, 'houseMembers'),
        where('userId', '==', user!.id)
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        retryCount.current = 0
        const mems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HouseMember)
        setMemberships(mems)

        // Tear down previous house listeners
        houseUnsubs.current.forEach((unsub) => unsub())
        houseUnsubs.current = []

        // Set up real-time listeners for each house doc
        const houseMap = new Map<string, House>()
        let initialCount = 0

        if (mems.length === 0) {
          setHouses([])
          setLoading(false)
          return
        }

        for (const m of mems) {
          const unsub = onSnapshot(doc(db, 'houses', m.houseId), (houseSnap) => {
            if (houseSnap.exists()) {
              const house = { id: houseSnap.id, ...houseSnap.data() } as House
              if (!house.isArchived) {
                houseMap.set(house.id, house)
              } else {
                houseMap.delete(house.id)
              }
            } else {
              houseMap.delete(m.houseId)
            }

            const validHouses = Array.from(houseMap.values())
            setHouses(validHouses)

            // Auto-select on initial load
            initialCount++
            if (initialCount === mems.length) {
              if (!selectedHouseId && validHouses.length > 0) {
                const firstId = validHouses[0]!.id
                setSelectedHouseId(firstId)
                localStorage.setItem(SELECTED_HOUSE_KEY, firstId)
              }
              setLoading(false)
            }
          })
          houseUnsubs.current.push(unsub)
        }
      }, (error) => {
        console.error('houseMembers snapshot error:', error)
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
      houseUnsubs.current.forEach((unsub) => unsub())
      houseUnsubs.current = []
      clearTimeout(retryTimer)
    }
  }, [user, selectedHouseId])

  const selectedHouse = houses.find((h) => h.id === selectedHouseId) ?? null

  function selectHouse(houseId: string) {
    setSelectedHouseId(houseId)
    localStorage.setItem(SELECTED_HOUSE_KEY, houseId)
  }

  return (
    <HouseContext.Provider value={{ houses, memberships, selectedHouse, selectHouse, loading }}>
      {children}
    </HouseContext.Provider>
  )
}

export function useHouse() {
  const ctx = useContext(HouseContext)
  if (!ctx) throw new Error('useHouse must be used within HouseProvider')
  return ctx
}
