import { collection, getDocs } from 'firebase/firestore'
import { mockResources } from '@/lib/data/resources'
import { getDb } from '@/lib/firebase'
import type { ResourceCategory } from '@/lib/types'

export async function getResourceCategories(): Promise<ResourceCategory[]> {
  const db = getDb()
  if (!db) return mockResources

  try {
    const snapshot = await getDocs(collection(db, 'resources'))
    const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceCategory)
    return remote.length ? remote : mockResources
  } catch (error) {
    console.error('[resources] Firestore read failed, using mock data:', error)
    return mockResources
  }
}
