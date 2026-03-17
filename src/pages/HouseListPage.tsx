import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import type { House, HouseMember } from '../types'
import { Plus, Home, Loader2, LogOut } from 'lucide-react'

export default function HouseListPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [memberships, setMemberships] = useState<HouseMember[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      const q = query(collection(db, 'houseMembers'), where('userId', '==', user!.id))
      const snap = await getDocs(q)
      const mems = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HouseMember)
      setMemberships(mems)

      const housePromises = mems.map(async (m) => {
        const hSnap = await getDoc(doc(db, 'houses', m.houseId))
        if (hSnap.exists()) return { id: hSnap.id, ...hSnap.data() } as House
        return null
      })

      const results = await Promise.all(housePromises)
      setHouses(results.filter((h): h is House => h !== null && !h.isArchived))
      setLoading(false)
    }

    load()
  }, [user])

  function handleSelectHouse(houseId: string) {
    localStorage.setItem('passover-check-selected-house', houseId)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">הבתים שלי</h1>
        <button onClick={signOut} className="text-on-surface-muted hover:text-danger-600">
          <LogOut size={20} />
        </button>
      </div>

      {houses.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <Home size={48} className="mx-auto text-on-surface-muted mb-4" />
          <h2 className="text-lg font-semibold mb-2">אין בתים עדיין</h2>
          <p className="text-on-surface-muted mb-6">צרו בית חדש או הצטרפו לבית קיים</p>
          <div className="flex flex-col gap-3">
            <Link
              to="/houses/new"
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium text-center"
            >
              <Plus size={18} className="inline ml-1" />
              בית חדש
            </Link>
            <Link
              to="/join"
              className="bg-white border border-gray-200 px-6 py-3 rounded-xl font-medium text-center"
            >
              הצטרפות עם קוד
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {houses.map((house) => {
            const membership = memberships.find((m) => m.houseId === house.id)
            return (
              <button
                key={house.id}
                onClick={() => handleSelectHouse(house.id)}
                className="w-full bg-white rounded-xl p-4 shadow-sm text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <span className="text-3xl">{house.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{house.name}</h3>
                  <p className="text-sm text-on-surface-muted">
                    {membership?.role === 'owner' ? 'בעלים' : 'חבר'}
                  </p>
                </div>
              </button>
            )
          })}

          <div className="flex gap-3 pt-4">
            <Link
              to="/houses/new"
              className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-xl font-medium text-center text-sm"
            >
              <Plus size={16} className="inline ml-1" />
              בית חדש
            </Link>
            <Link
              to="/join"
              className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-xl font-medium text-center text-sm"
            >
              הצטרפות
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
