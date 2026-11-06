import { mockMasjids } from '@/lib/data/masjids'
import { torontoMasjids } from '@/lib/data/toronto-masjids'
import { getSupabase } from '@/lib/supabase'
import { haversineKm, isValidCoord, roundKm } from '@/lib/geo'
import { geocodeLocation, TORONTO_BOUNDARY_ID } from '@/lib/services/geocoding'
import { findMosquesInBoundary, findMosquesNearby, getMosqueByOsmId, parseMasjidId, toMasjidId, type OsmMasjid } from '@/lib/services/overpass'
import { getPrayerTimes } from '@/lib/services/prayer-times'
import type { Masjid, PrayerTimes } from '@/lib/types'

export class LocationNotFoundError extends Error {
  constructor() {
    super('We could not identify a single matching location. Add a province, state, country, or postal code.')
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
  origin: { lat: number; lng: number; label?: string; area?: boolean }
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
  const { boundaryId } = origin
  const curated = !boundaryId || boundaryId === TORONTO_BOUNDARY_ID ? torontoMasjids : []
  const [mosques, prayerTimes] = await Promise.all([
    boundaryId ? findMosquesInBoundary(boundaryId) : findMosquesNearby(origin.lat, origin.lng, radius),
    getPrayerTimes(origin.lat, origin.lng).catch(() => DEFAULT_PRAYER_TIMES),
  ])

  return {
    origin: { lat: origin.lat, lng: origin.lng, label: origin.label ? shortLabel(origin.label) : undefined, area: Boolean(boundaryId) },
    masjids: [...curated.map((masjid) => withDistance(masjid, prayerTimes, origin)),
      ...mosques.filter((mosque) => !curated.some((masjid) =>
        haversineKm(mosque.lat, mosque.lng, masjid.latitude, masjid.longitude) < 0.15 &&
        /agincourt muslim|namira|al[ -]?faisal|abu hurai|dar\s*us[ -]*salaam|islamic society of toronto/i.test(mosque.name)
      )).map((mosque) => toMasjid(mosque, origin.lat, origin.lng, prayerTimes))]
      .filter((masjid) => boundaryId || masjid.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, boundaryId ? undefined : 40),
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

  const curated = torontoMasjids.find((masjid) => masjid.id === id)
  if (curated) {
    const prayerTimes = await getPrayerTimes(curated.latitude, curated.longitude).catch(() => DEFAULT_PRAYER_TIMES)
    return withDistance(curated, prayerTimes, origin)
  }

  // Curated listings (not from OpenStreetMap) live in the masjids table.
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase.from('masjids').select('*').eq('id', id).maybeSingle()
    if (error) console.error('[masjids] Supabase read failed:', error.message)
    if (data) return fromRow(data as MasjidRow)
  }

  return mockMasjids.find((m) => m.id === id) ?? null
}

interface MasjidRow {
  id: string
  name: string
  address: string
  city: string
  province: string
  postal_code: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  description: string
  services: string[]
  prayer_times: PrayerTimes
}

function fromRow(row: MasjidRow): Masjid {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceKm: 0,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    description: row.description,
    services: row.services,
    prayerTimes: row.prayer_times,
  }
}

async function resolveOrigin(location?: string, lat?: number, lng?: number): Promise<{ lat: number; lng: number; label?: string; boundaryId?: number }> {
  const query = location?.trim() ?? ''
  if (!query && lat != null && lng != null && isValidCoord(lat, lng)) {
    return { lat, lng }
  }

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

function withDistance(
  masjid: (typeof torontoMasjids)[number],
  prayerTimes: PrayerTimes,
  origin?: { lat: number; lng: number },
): Masjid {
  const distanceKm = origin ? roundKm(haversineKm(origin.lat, origin.lng, masjid.latitude, masjid.longitude)) : 0
  return { ...masjid, distanceKm, prayerTimes, services: [] }
}