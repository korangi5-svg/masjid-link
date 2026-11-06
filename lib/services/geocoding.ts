import { cacheGetOrSet } from '@/lib/ttl-cache'
import { haversineKm, isValidCoord } from '@/lib/geo'
import { fetchJson } from '@/lib/services/http'

export interface GeoPoint {
  lat: number
  lng: number
  label: string
  city: string
  province: string
  countryCode?: string
  regionCode?: string
  postalCode: string
  boundaryId?: number
}

interface NominatimHit {
  lat: string
  lon: string
  display_name?: string
  osm_type?: string
  osm_id?: number
  addresstype?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    province?: string
    postcode?: string
    country_code?: string
    'ISO3166-2-lvl4'?: string
    country?: string
  }
}

interface PhotonResponse {
  features?: Array<{
    geometry?: { coordinates?: [number, number] }
    properties?: {
      name?: string
      street?: string
      housenumber?: string
      city?: string
      state?: string
      postcode?: string
      countrycode?: string
      country?: string
    }
  }>
}

export const TORONTO_BOUNDARY_ID = 324211

const GEOCODE_TTL_MS = 1000 * 60 * 60 * 24

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  if (/^toronto(?:,? (?:ontario|on))?(?:,? canada)?$/i.test(query.trim())) {
    return { lat: 43.65348, lng: -79.38393, label: 'Toronto, Ontario, Canada', city: 'Toronto', province: 'Ontario', countryCode: 'CA', postalCode: '', boundaryId: TORONTO_BOUNDARY_ID }
  }
  const key = `geocode:v3:${query.trim().toLowerCase()}`
  return cacheGetOrSet(key, GEOCODE_TTL_MS, async () => {
    try {
      return await geocodeNominatim(query) ?? await geocodePhoton(query)
    } catch (error) {
      if (error instanceof AmbiguousLocationError) return null
      throw error
    }
  })
}

async function geocodeNominatim(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&q=${encodeURIComponent(query)}`
    const hits = await fetchJson<NominatimHit[]>(url, { timeoutMs: 8000 })
    const namedBoundaries = hits.filter((hit) => boundaryId(hit) &&
      normalizeLocation(hit.display_name?.split(',')[0] ?? '').replace(/ (district|town)$/, '') ===
      normalizeLocation(query.split(',')[0]).replace(/ (district|town)$/, ''))
    const hit = uniqueMatch(namedBoundaries.length ? namedBoundaries : hits, (hit) => hit.display_name ?? '', (hit) => [Number(hit.lat), Number(hit.lon)], query)
    if (!hit) return null
    const address = hit.address ?? {}
    return {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      label: hit.display_name ?? query,
      city: address.city || address.town || address.village || address.municipality || '',
      province: address.state || address.province || '',
      countryCode: address.country_code?.toUpperCase(),
      regionCode: address['ISO3166-2-lvl4'],
      postalCode: address.postcode || '',
      boundaryId: boundaryId(hit),
    }
  } catch (error) {
    if (error instanceof AmbiguousLocationError) throw error
    return null
  }
}

async function geocodePhoton(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(query)}`
    const body = await fetchJson<PhotonResponse>(url, { timeoutMs: 8000 })
    const feature = uniqueMatch(body.features ?? [], (feature) => photonLabel(feature.properties), (feature) => feature.geometry?.coordinates?.slice().reverse(), query)
    const coords = feature?.geometry?.coordinates
    if (!coords) return null
    const [lng, lat] = coords
    const props = feature.properties ?? {}
    return {
      lat,
      lng,
      label: photonLabel(props),
      city: props.city || props.name || '',
      province: props.state || '',
      countryCode: props.countrycode?.toUpperCase(),
      postalCode: props.postcode || '',
    }
  } catch (error) {
    if (error instanceof AmbiguousLocationError) throw error
    return null
  }
}

function photonLabel(props: NonNullable<PhotonResponse['features']>[number]['properties']) {
  if (!props) return ''
  return [props.housenumber, props.street, props.name, props.city, props.state, props.postcode, props.country]
    .filter(Boolean).join(', ')
}

function normalizeLocation(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    .replace(/\b(ave|rd|st|blvd|on|e|w|n|s)\b/g, (part) => ({
      ave: 'avenue', rd: 'road', st: 'street', blvd: 'boulevard',
      on: 'ontario', e: 'east', w: 'west', n: 'north', s: 'south',
    })[part] ?? part)
    .replace(/\b([a-z]\d[a-z]) ?(\d[a-z]\d)\b/g, '$1$2')
}

function uniqueMatch<T>(candidates: T[], label: (candidate: T) => string, coordinates: (candidate: T) => number[] | undefined, query: string): T | undefined {
  const terms = normalizeLocation(query).split(' ').filter(Boolean)
  if (!terms.length) return undefined

  const matches = candidates.filter((candidate) => {
    const words = new Set(normalizeLocation(label(candidate)).split(' '))
    return terms.every((term) => words.has(term))
  })
  const first = matches.find((candidate) => {
    const [lat, lng] = coordinates(candidate) ?? []
    return isValidCoord(lat, lng)
  })
  if (!first) return undefined

  const [lat, lng] = coordinates(first)!
  const hasDistantMatch = matches.some((candidate) => {
    const [otherLat, otherLng] = coordinates(candidate) ?? []
    return isValidCoord(otherLat, otherLng) && haversineKm(lat, lng, otherLat, otherLng) > 25
  })
  if (hasDistantMatch) throw new AmbiguousLocationError()
  return first
}

class AmbiguousLocationError extends Error {}

function boundaryId(hit: NominatimHit) {
  return hit.osm_type === 'relation' && Number.isSafeInteger(hit.osm_id) &&
    /^(city|town|village|municipality|borough|suburb|quarter|district|city_district|county|state_district|state|province|region|administrative)$/.test(hit.addresstype ?? '')
    ? hit.osm_id : undefined
}
