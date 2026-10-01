import { doc, getDoc } from 'firebase/firestore'
import { mockMasjids } from '@/lib/data/masjids'
import { getDb } from '@/lib/firebase'
import { haversineKm, isValidCoord, roundKm } from '@/lib/geo'
import { geocodeLocation } from '@/lib/services/geocoding'
import { findMosquesNearby, getMosqueByOsmId, parseMasjidId, toMasjidId, type OsmMasjid } from '@/lib/services/overpass'
import { getPrayerTimes } from '@/lib/services/prayer-times'
import type { Masjid, PrayerTimes } from '@/lib/types'

export class LocationNotFoundError extends Error {
  constructor() {
    super('We could not find that location. Try a city, neighbourhood, or postal code.')
  }
}

export interface NearbySearchInput {
  location?: string
  lat?: number
  lng?: number
  radiusKm?: number
}

const DEFAULT_PRAYER_TIMES: PrayerTimes = {
  fajr: '—',
  dhuhr: '—',
  asr: '—',
  maghrib: '—',
  isha: '—',
  jumuah: '—',
}

export interface NearbySearchResult {
  /** label is the place the geocoder matched, so users can spot a wrong match. */
  origin: { lat: number; lng: number; label?: string }
  masjids: Masjid[]
}

export async function searchMasjidsNearby({
  location,
  lat,
  lng,
  radiusKm = 15,
}: NearbySearchInput): Promise<NearbySearchResult> {
  const origin = await resolveOrigin(location, lat, lng)
  const radius = Math.min(Math.max(radiusKm, 1), 50)
  const [mosques, prayerTimes] = await Promise.all([
    findMosquesNearby(origin.lat, origin.lng, radius),
    getPrayerTimes(origin.lat, origin.lng).catch(() => DEFAULT_PRAYER_TIMES),
  ])

  return {
    origin: { lat: origin.lat, lng: origin.lng, label: 'label' in origin ? shortLabel(origin.label) : undefined },
    masjids: mosques.map((mosque) => toMasjid(mosque, origin.lat, origin.lng, prayerTimes)),
  }
}

export async function getMasjidById(id: string, origin?: { lat: number; lng: number }): Promise<Masjid | null> {
  const osm = parseMasjidId(id)
  if (osm) {
    const mosque = await getMosqueByOsmId(osm.type, osm.osmId)
    if (!mosque) return null
    const prayerTimes = await getPrayerTimes(mosque.lat, mosque.lng).catch(() => DEFAULT_PRAYER_TIMES)
    const from = origin ?? { lat: mosque.lat, lng: mosque.lng }
    return toMasjid(mosque, from.lat, from.lng, prayerTimes)
  }

  const db = getDb()
  if (db) {
    try {
      const snapshot = await getDoc(doc(db, 'masjids', id))
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Masjid
    } catch (error) {
      console.error('[masjids] Firestore read failed:', error)
    }
  }

  return mockMasjids.find((m) => m.id === id) ?? null
}

async function resolveOrigin(location?: string, lat?: number, lng?: number) {
  if (lat != null && lng != null && isValidCoord(lat, lng)) {
    return { lat, lng }
  }

  const query = location?.trim() ?? ''
  if (!query) throw new LocationNotFoundError()

  const point = await geocodeLocation(query)
  if (!point || !isValidCoord(point.lat, point.lng)) throw new LocationNotFoundError()
  return point
}

// "350, 5th Avenue, City of Watervliet, Albany County, New York, 12189, United States" → first four parts.
function shortLabel(label: string) {
  return label.split(',').map((part) => part.trim()).filter(Boolean).slice(0, 4).join(', ')
}

function toMasjid(mosque: OsmMasjid, originLat: number, originLng: number, prayerTimes: PrayerTimes): Masjid {
  return {
    id: toMasjidId(mosque.osmType, mosque.osmId),
    name: mosque.name,
    address: mosque.address,
    city: mosque.city,
    province: mosque.province,
    postalCode: mosque.postalCode,
    latitude: mosque.lat,
    longitude: mosque.lng,
    distanceKm: roundKm(haversineKm(originLat, originLng, mosque.lat, mosque.lng)),
    phone: mosque.phone,
    website: mosque.website,
    description: mosque.description,
    services: mosque.services,
    prayerTimes,
  }
}
