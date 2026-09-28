import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { mockEvents } from '@/lib/data/events'
import { getDb } from '@/lib/firebase'
import type { CommunityEvent } from '@/lib/types'

const COLLECTION = 'events'

export async function getEvents(): Promise<CommunityEvent[]> {
  const db = getDb()
  let events = mockEvents

  if (db) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityEvent)
      if (remote.length) events = remote
    } catch (error) {
      console.error('[events] Firestore read failed, using mock data:', error)
    }
  }

  return [...events].sort((a, b) => a.date.localeCompare(b.date))
}

export async function getEventById(id: string): Promise<CommunityEvent | null> {
  const db = getDb()
  if (db) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, id))
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as CommunityEvent
    } catch (error) {
      console.error('[events] Firestore read failed, using mock data:', error)
    }
  }
  return mockEvents.find((e) => e.id === id) ?? null
}

export { formatEventDate } from '@/lib/services/event-format'
