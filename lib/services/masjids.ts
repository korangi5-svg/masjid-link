import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { mockMasjids } from '@/lib/data/masjids'
import { getDb } from '@/lib/firebase'
import { filterMasjids } from '@/lib/masjid-filters'
import type { Masjid } from '@/lib/types'

const COLLECTION = 'masjids'

export async function getMasjids(): Promise<Masjid[]> {
  const db = getDb()
  if (!db) return mockMasjids

  try {
    const snapshot = await getDocs(collection(db, COLLECTION))
    const masjids = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Masjid)
    return masjids.length ? masjids : mockMasjids
  } catch (error) {
    console.error('[masjids] Firestore read failed, using mock data:', error)
    return mockMasjids
  }
}

export async function getMasjidById(id: string): Promise<Masjid | null> {
  const db = getDb()
  if (db) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, id))
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Masjid
    } catch (error) {
      console.error('[masjids] Firestore read failed, using mock data:', error)
    }
  }
  return mockMasjids.find((m) => m.id === id) ?? null
}

/**
 * Location search entry point. Replace the body with a Google Maps Geocoding +
 * Firestore geo-query when ready; callers only depend on the returned list.
 */
export async function searchMasjidsByLocation(location: string): Promise<Masjid[]> {
  const masjids = await getMasjids()
  return filterMasjids(masjids, { query: location })
}
