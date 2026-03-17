import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
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
  useEffect(() => {
    if (!user) {
      setMemberships([])
      setHouses([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'houseMembers'),
      where('userId', '==', user.id)
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const mems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HouseMember)
      setMemberships(mems)

      // Fetch house docs
      const housePromises = mems.map(async (m) => {
        const houseSnap = await getDoc(doc(db, 'houses', m.houseId))
        if (houseSnap.exists()) {
          return { id: houseSnap.id, ...houseSnap.data() } as House
        }
        return null
      })

      const houseResults = await Promise.all(housePromises)
      const validHouses = houseResults.filter((h): h is House => h !== null && !h.isArchived)
      setHouses(validHouses)

      // Auto-select first house if none selected
      if (!selectedHouseId && validHouses.length > 0) {
        const firstId = validHouses[0]!.id
        setSelectedHouseId(firstId)
        localStorage.setItem(SELECTED_HOUSE_KEY, firstId)
      }

      setLoading(false)
    })

    return unsubscribe
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
