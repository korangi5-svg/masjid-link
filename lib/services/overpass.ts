import { after } from 'next/server'
import { cacheGetOrSet, cacheSet } from '@/lib/ttl-cache'
import { HttpError, fetchJson, fetchText } from '@/lib/services/http'
import { haversineKm } from '@/lib/geo'
import { boxId, circleBox, getOsmStore, snapBox, type Box } from '@/lib/services/osm-store'

export type OsmElementType = 'node' | 'way' | 'relation'

export interface OsmMasjid {
  osmType: OsmElementType
  osmId: number
  name: string
  lat: number
  lng: number
  address: string
  city: string
  province: string
  postalCode: string
  phone?: string
  website?: string
  description: string
  services: string[]
}

interface OverpassElement {
  type: OsmElementType
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
  remark?: string
}

interface NominatimSearchHit {
  osm_type?: string
  osm_id?: number
  lat: string
  lon: string
  display_name?: string
  name?: string
  address?: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    postcode?: string
  }
}

interface PhotonResponse {
  features?: Array<{
    geometry?: { coordinates?: [number, number] }
    properties?: {
      osm_type?: string
      osm_id?: number
      name?: string
      street?: string
      housenumber?: string
      city?: string
      state?: string
      postcode?: string
      country?: string
    }
  }>
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// Photon is a name search, so query the words mosques are commonly named with and merge the hits.
const FALLBACK_TERMS = ['mosque', 'masjid', 'islamic', 'musjid', 'muslim']

const NEARBY_TTL_MS = 1000 * 60 * 15
// Fallback results are incomplete, so retry Overpass soon rather than serving them for long.
const FALLBACK_TTL_MS = 1000 * 60 * 2
const BY_ID_TTL_MS = 1000 * 60 * 60
// Longest a search waits for Overpass before answering with quicker (partial) results.
const OVERPASS_DEADLINE_MS = 5000
const TIMED_OUT = Symbol('timed out')
const FAILED = Symbol('failed')

export function toMasjidId(type: OsmElementType, id: number) {
  return `osm-${type}-${id}`
}

export function parseMasjidId(id: string): { type: OsmElementType; osmId: number } | null {
  const match = /^osm-(node|way|relation)-(\d+)$/.exec(id)
  if (!match) return null
  return { type: match[1] as OsmElementType, osmId: Number(match[2]) }
}

export async function findMosquesNearby(lat: number, lng: number, radiusKm: number): Promise<OsmMasjid[]> {
  const radius = Math.min(Math.max(radiusKm, 1), 50)
  const key = `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`
  const result = await cacheGetOrSet(key, (r) => (r.complete ? NEARBY_TTL_MS : FALLBACK_TTL_MS), async () => {
    const nearest = (list: OsmMasjid[]) => ({
      masjids: dedupe(list)
        .map((m) => ({ m, km: haversineKm(lat, lng, m.lat, m.lng) }))
        .filter(({ km }) => km <= radius)
        .sort((x, y) => x.km - y.km)
        .slice(0, 40)
        .map(({ m }) => m),
    })

    const area = circleBox(lat, lng, radius)
    const store = getOsmStore()

    // 1. Shared cache: areas fetched recently (or preloaded) answer straight from Supabase.
    if (store) {
      try {
        if (await store.isCovered(area)) return { ...nearest(await store.query(area)), complete: true }
      } catch (error) {
        console.error('[overpass] shared cache read failed:', error)
      }
    }

    // 2. Overpass, snapped to a grid so neighbouring searches reuse the same fetched area.
    const fetchArea = snapBox(area)
    const full = fetchMosquesInBox(fetchArea).then(async (list) => {
      if (store) await store.replaceArea(boxId(fetchArea), fetchArea, list).catch((e) => console.error('[overpass] cache write failed:', e))
      return list
    })
    const first = await withDeadline(
      full.catch((error): typeof FAILED => {
        console.error('[overpass] nearby query failed:', error)
        return FAILED
      }),
      OVERPASS_DEADLINE_MS,
    )
    if (first !== TIMED_OUT && first !== FAILED) return { ...nearest(first), complete: true }

    // 3. Too slow or failed: answer now with quick results, and let Overpass finish in the background
    //    so the shared cache is complete for the next search here.
    // When it lands, the complete list replaces this partial answer in memory as well.
    if (first === TIMED_OUT) {
      after(
        full.then(
          (list) => cacheSet(key, { ...nearest(list), complete: true }, NEARBY_TTL_MS),
          () => undefined,
        ),
      )
    }
    const [quick, stored] = await Promise.all([
      findMosquesFallback(lat, lng, radius),
      store ? store.query(area).catch(() => []) : Promise.resolve([]),
    ])
    return { ...nearest([...stored, ...quick]), complete: false }
  })
  return result.masjids
}

/** Every masjid inside a box, straight from Overpass. Used for searches and for preloading regions. */
export async function fetchMosquesInBox(box: Box, { timeoutSec = 25 } = {}): Promise<OsmMasjid[]> {
  const query = `
[out:json][timeout:${timeoutSec}];
nwr["amenity"="place_of_worship"]["religion"="muslim"](${box.south},${box.west},${box.north},${box.east});
out center tags;
`.trim()
  const elements = await runOverpass(query, (timeoutSec + 10) * 1000)
  return elements.map(mapElement).filter((m): m is OsmMasjid => Boolean(m))
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout>
  const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms)
  })
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

export async function getMosqueByOsmId(type: OsmElementType, osmId: number): Promise<OsmMasjid | null> {
  const key = `osm:${type}:${osmId}`
  return cacheGetOrSet(key, BY_ID_TTL_MS, async () => {
    const stored = await getOsmStore()?.getById(type, osmId).catch(() => null)
    if (stored) return stored
    try {
      const query = `
[out:json][timeout:20];
${type}(${osmId});
out center tags;
`.trim()
      const elements = await runOverpass(query)
      const mapped = elements.map(mapElement).filter((m): m is OsmMasjid => Boolean(m))
      if (mapped[0]) return mapped[0]
    } catch (error) {
      console.error('[overpass] lookup failed, using Nominatim:', error)
    }
    return lookupNominatim(type, osmId)
  })
}

async function runOverpass(query: string, timeoutMs = 25000): Promise<OverpassElement[]> {
  // Public Overpass mirrors are often overloaded; race them and take the first good answer.
  try {
    const json = await Promise.any(OVERPASS_ENDPOINTS.map((endpoint) => postOverpass(endpoint, query, timeoutMs)))
    return json.elements ?? []
  } catch (error) {
    const first = error instanceof AggregateError ? error.errors[0] : error
    if (first instanceof HttpError) throw first
    throw new HttpError('Could not reach OpenStreetMap')
  }
}

async function postOverpass(endpoint: string, query: string, timeoutMs: number): Promise<OverpassResponse> {
  const text = await fetchText(endpoint, {
    method: 'POST',
    timeoutMs,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (text.trimStart().startsWith('<')) throw new HttpError('Overpass returned an error page')
  const json = JSON.parse(text) as OverpassResponse
  // A query that runs out of time or memory returns a partial list plus a remark. Treat it as a failure:
  // saving it as complete would delete the missing masjids from the shared cache.
  if (json.remark && /error|timed out|out of memory/i.test(json.remark)) throw new HttpError(`Overpass: ${json.remark}`)
  return json
}

async function findMosquesFallback(lat: number, lng: number, radiusKm: number): Promise<OsmMasjid[]> {
  const batches = await Promise.all([
    ...FALLBACK_TERMS.map((term) => searchPhotonMosques(term, lat, lng, radiusKm)),
    searchNominatimMosques(lat, lng, radiusKm),
  ])
  const byOsmId = new Map<string, OsmMasjid>()
  for (const m of batches.flat()) {
    const key = `${m.osmType}:${m.osmId}`
    // Prefer the entry with a real street address when sources disagree.
    if (!byOsmId.has(key) || byOsmId.get(key)!.address.startsWith('See map')) byOsmId.set(key, m)
  }
  return [...byOsmId.values()]
}

async function searchPhotonMosques(term: string, lat: number, lng: number, radiusKm: number): Promise<OsmMasjid[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${term}&lat=${lat}&lon=${lng}&limit=50&osm_tag=amenity:place_of_worship`
    const body = await fetchJson<PhotonResponse>(url, { timeoutMs: 8000 })
    return (body.features ?? [])
      .map((feature) => {
        const coords = feature.geometry?.coordinates
        const props = feature.properties ?? {}
        if (!coords || props.osm_id == null) return null
        const [featureLng, featureLat] = coords
        if (haversineKm(lat, lng, featureLat, featureLng) > radiusKm) return null
        const house = [props.housenumber, props.street].filter(Boolean).join(' ')
        return {
          osmType: photonType(props.osm_type),
          osmId: props.osm_id,
          name: props.name || 'Masjid',
          lat: featureLat,
          lng: featureLng,
          address: house || 'See map for street address',
          city: props.city || '',
          province: props.state || '',
          postalCode: props.postcode || '',
          description: `${props.name || 'This masjid'} is listed on OpenStreetMap in ${props.city || props.country || 'this area'}.`,
          services: ['Daily prayers'],
        } satisfies OsmMasjid
      })
      .filter((m): m is OsmMasjid => Boolean(m))
  } catch {
    return []
  }
}

async function searchNominatimMosques(lat: number, lng: number, radiusKm: number): Promise<OsmMasjid[]> {
  try {
    const delta = radiusKm / 111
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=30&bounded=1&viewbox=${viewbox}&q=mosque`
    const hits = await fetchJson<NominatimSearchHit[]>(url, { timeoutMs: 8000 })
    return hits
      .map(nominatimToMasjid)
      .filter((m): m is OsmMasjid => m != null && haversineKm(lat, lng, m.lat, m.lng) <= radiusKm)
  } catch {
    return []
  }
}

async function lookupNominatim(type: OsmElementType, osmId: number): Promise<OsmMasjid | null> {
  try {
    const prefix = type === 'node' ? 'N' : type === 'way' ? 'W' : 'R'
    const url = `https://nominatim.openstreetmap.org/lookup?format=jsonv2&addressdetails=1&osm_ids=${prefix}${osmId}`
    const hits = await fetchJson<NominatimSearchHit[]>(url, { timeoutMs: 8000 })
    return nominatimToMasjid(hits[0])
  } catch {
    return null
  }
}

function nominatimToMasjid(hit?: NominatimSearchHit): OsmMasjid | null {
  if (!hit?.osm_id || !hit.osm_type) return null
  const address = hit.address ?? {}
  const house = [address.house_number, address.road].filter(Boolean).join(' ')
  const city = address.city || address.town || address.village || address.municipality || ''
  return {
    osmType: nominatimType(hit.osm_type),
    osmId: hit.osm_id,
    name: hit.name || 'Masjid',
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    address: house || hit.display_name || 'See map for street address',
    city,
    province: address.state || '',
    postalCode: address.postcode || '',
    description: `${hit.name || 'This masjid'} is listed on OpenStreetMap${city ? ` in ${city}` : ''}.`,
    services: ['Daily prayers'],
  }
}

function mapElement(el: OverpassElement): OsmMasjid | null {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null
  const tags = el.tags ?? {}
  const name = tags.name || tags['name:en'] || tags['name:ar'] || 'Masjid'

  const house = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const address = tags['addr:full'] || house || tags['addr:place'] || 'See map for street address'
  const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:town'] || tags['addr:village'] || ''
  const province = tags['addr:state'] || tags['addr:province'] || tags['addr:region'] || ''
  const postalCode = tags['addr:postcode'] || ''
  const phone = tags.phone || tags['contact:phone']
  const website = normalizeUrl(tags.website || tags['contact:website'] || tags.url)

  const services = ['Daily prayers']
  if (tags.wheelchair === 'yes') services.push('Wheelchair access')
  if (tags.parking || tags['parking:lane'] || tags['amenity:parking']) services.push('Parking')
  if (tags.denomination) services.push(capitalize(tags.denomination))

  const place = city || 'this area'
  const description =
    tags.description ||
    `${name} is listed as a masjid in ${place} on OpenStreetMap. Prayer times are calculated for this location — confirm iqamah times with the masjid.`

  return {
    osmType: el.type,
    osmId: el.id,
    name,
    lat,
    lng,
    address,
    city,
    province,
    postalCode,
    phone,
    website,
    description,
    services,
  }
}

function dedupe(masjids: OsmMasjid[]) {
  const seen = new Set<string>()
  const byId = new Set<string>()
  return masjids.filter((m) => {
    const id = `${m.osmType}:${m.osmId}`
    if (byId.has(id)) return false
    byId.add(id)
    const key = `${m.name.toLowerCase()}|${m.lat.toFixed(4)}|${m.lng.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeUrl(value?: string) {
  if (!value) return undefined
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function nominatimType(value: string): OsmElementType {
  if (value === 'way') return 'way'
  if (value === 'relation') return 'relation'
  return 'node'
}

function photonType(value?: string): OsmElementType {
  if (value === 'W') return 'way'
  if (value === 'R') return 'relation'
  return 'node'
}
