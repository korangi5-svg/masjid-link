import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { ServiceResult } from '@/lib/types'

const NOT_CONFIGURED =
  'Accounts are not available yet. Authentication will be enabled once Firebase is connected.'

function toMessage(error: unknown) {
  const code = (error as { code?: string })?.code ?? ''
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Please choose a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  }
  return messages[code] ?? 'Something went wrong. Please try again.'
}

export async function signIn(email: string, password: string, remember: boolean): Promise<ServiceResult> {
  const auth = getFirebaseAuth()
  if (!auth) return { ok: false, error: NOT_CONFIGURED }
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    await signInWithEmailAndPassword(auth, email, password)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}

export interface SignUpInput {
  fullName: string
  email: string
  password: string
  location: string
}

export async function signUp({ fullName, email, password, location }: SignUpInput): Promise<ServiceResult> {
  const auth = getFirebaseAuth()
  if (!auth) return { ok: false, error: NOT_CONFIGURED }
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName: fullName })
    const db = getDb()
    if (db) {
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        location,
        createdAt: serverTimestamp(),
      })
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}

export async function requestPasswordReset(email: string): Promise<ServiceResult> {
  const auth = getFirebaseAuth()
  if (!auth) return { ok: false, error: NOT_CONFIGURED }
  try {
    await sendPasswordResetEmail(auth, email)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}
