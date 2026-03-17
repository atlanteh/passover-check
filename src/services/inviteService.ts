import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Invite, MemberRole, User } from '../types'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createInvite(
  houseId: string,
  createdBy: string,
  role: MemberRole
): Promise<string> {
  const code = generateCode()
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days

  await addDoc(collection(db, 'invites'), {
    houseId,
    code,
    createdBy,
    role,
    expiresAt,
    isActive: true,
  })

  return code
}

export async function getActiveInvites(houseId: string): Promise<Invite[]> {
  const q = query(
    collection(db, 'invites'),
    where('houseId', '==', houseId),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite)
}

export async function redeemInvite(code: string, user: User): Promise<string> {
  const q = query(
    collection(db, 'invites'),
    where('code', '==', code),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)

  if (snap.empty) {
    throw new Error('קוד הזמנה לא תקף')
  }

  const inviteDoc = snap.docs[0]!
  const invite = inviteDoc.data() as Omit<Invite, 'id'>

  // Check expiry
  if (invite.expiresAt.toDate() < new Date()) {
    throw new Error('קוד ההזמנה פג תוקף')
  }

  // Check if already used
  if (invite.usedBy) {
    throw new Error('קוד ההזמנה כבר נוצל')
  }

  // Check if already a member
  const memberRef = doc(db, 'houseMembers', `${invite.houseId}_${user.id}`)
  const memberSnap = await getDoc(memberRef)
  if (memberSnap.exists()) {
    throw new Error('את/ה כבר חבר/ה בבית הזה')
  }

  // Add member and mark invite as used
  const batch = writeBatch(db)

  batch.set(memberRef, {
    houseId: invite.houseId,
    userId: user.id,
    displayName: user.displayName,
    role: invite.role,
    joinedAt: serverTimestamp(),
  })

  batch.update(inviteDoc.ref, {
    usedBy: user.id,
    usedAt: serverTimestamp(),
    isActive: false,
  })

  await batch.commit()
  return invite.houseId
}
