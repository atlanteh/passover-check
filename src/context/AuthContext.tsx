import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'
import type { User } from '../types'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  user: User | null
  loading: boolean
  authorized: boolean | null // null = not checked yet
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        const allowed = await checkAllowedUser(fbUser)
        setAuthorized(allowed)
        if (allowed) {
          await ensureUserDoc(fbUser)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
        setAuthorized(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function checkAllowedUser(fbUser: FirebaseUser): Promise<boolean> {
    const email = fbUser.email?.toLowerCase()
    if (!email) return false
    const allowedRef = doc(db, 'allowedUsers', email)
    const snap = await getDoc(allowedRef)
    return snap.exists()
  }

  async function ensureUserDoc(fbUser: FirebaseUser) {
    const userRef = doc(db, 'users', fbUser.uid)
    const snap = await getDoc(userRef)

    if (!snap.exists()) {
      const newUser = {
        displayName: fbUser.displayName || '',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(userRef, newUser)
      const freshSnap = await getDoc(userRef)
      setUser({ id: fbUser.uid, ...freshSnap.data() } as User)
    } else {
      setUser({ id: fbUser.uid, ...snap.data() } as User)
      // Update profile if changed
      if (
        snap.data().displayName !== fbUser.displayName ||
        snap.data().photoURL !== fbUser.photoURL
      ) {
        await setDoc(userRef, {
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || null,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    }
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setUser(null)
    setAuthorized(null)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, authorized, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
