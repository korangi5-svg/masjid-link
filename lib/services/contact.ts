import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import type { ContactMessage, ServiceResult } from '@/lib/types'

export async function submitContactMessage(message: ContactMessage): Promise<ServiceResult> {
  const db = getDb()
  if (!db) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { ok: true }
  }
  try {
    await addDoc(collection(db, 'contactMessages'), { ...message, createdAt: serverTimestamp() })
    return { ok: true }
  } catch (error) {
    console.error('[contact] Failed to save message:', error)
    return { ok: false, error: 'We could not send your message. Please try again.' }
  }
}
