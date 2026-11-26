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

const provinceNames: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
}

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ')
  if (!trimmed) return null
  const postal = /^([a-z]\d[a-z])[\s-]*(\d[a-z]\d)$/i.exec(trimmed)
  const zip = /^(\d{5})(?:[ -]?\d{4})?(?:,? (?:US|USA|United States))?$/i.exec(trimmed)
  const postalCountry = postal ? 'CA' : zip ? 'US' : undefined
  const province = /^([^,\d]+?)(?:, | )([a-z]{2})(, Canada)?$/i.exec(trimmed)
  const provinceName = province && provinceNames[province[2].toUpperCase()]
  const location = postal ? (postal[1] + ' ' + postal[2]).toUpperCase()
    : zip ? zip[1]
    : province && provinceName && (province[2] === province[2].toUpperCase() || trimmed.includes(',') || province[3])
      ? [province[1], provinceName, 'Canada'].join(', ')
      : trimmed

  if (/^toronto(?:,? (?:ontario|on))?(?:,? canada)?$/i.test(location)) {
    return { lat: 43.65348, lng: -79.38393, label: 'Toronto, Ontario, Canada', city: 'Toronto', province: 'Ontario', countryCode: 'CA', postalCode: '', boundaryId: TORONTO_BOUNDARY_ID }
  }

  const key = 'geocode:v5:' + location.toLowerCase()
  return cacheGetOrSet(key, GEOCODE_TTL_MS, async () => {
    const osm = await geocodeNominatim(location, postalCountry).catch(() => null)
    if (osm) return osm
    const photon = await geocodePhoton(location, postalCountry).catch(() => null)
    if (photon) return photon
    if (postal) return geocodePostalArea(location.slice(0, 3), 'CA')
    return zip ? geocodePostalArea(location, 'US') : null
  })
}

interface PostalAreaResponse {
  places?: Array<{
    latitude: string
    longitude: string
    'place name': string
    state: string
  }>
}

async function geocodePostalArea(code: string, country: 'CA' | 'US'): Promise<GeoPoint | null> {
  try {
    const data = await fetchJson<PostalAreaResponse>(`https://api.zippopotam.us/${country}/${code}`, { timeoutMs: 4000 })
    const place = data.places?.find((item) => isValidCoord(Number(item.latitude), Number(item.longitude)))
    if (!place) return null
    const area = country === 'CA' ? `${code} postal area (approximate)` : `ZIP ${code} area`
    return {
      lat: Number(place.latitude), lng: Number(place.longitude),
      label: [area, place['place name'], place.state, country === 'CA' ? 'Canada' : 'United States'].filter(Boolean).join(', '),
      city: place['place name'], province: place.state, countryCode: country, postalCode: code,
    }
  } catch {
    return null
  }
}

async function geocodeNominatim(query: string, postal?: 'CA' | 'US'): Promise<GeoPoint | null> {
  try {
    const params = new URLSearchParams({ format: 'jsonv2', limit: '8', addressdetails: '1' })
    if (postal) {
      params.set('postalcode', query)
      params.set('countrycodes', postal.toLowerCase())
    } else {
      params.set('q', query)
    }
    const url = `https://nominatim.openstreetmap.org/search?${params}`
    const hits = await fetchJson<NominatimHit[]>(url, { timeoutMs: postal ? 4000 : 8000 })
    const candidates = postal ? hits.filter((hit) => hit.address?.country_code?.toUpperCase() === postal &&
      normalizeLocation(hit.address?.postcode ?? '') === normalizeLocation(query)) : hits
    const namedBoundaries = postal ? [] : candidates.filter((hit) => boundaryId(hit) &&
      normalizeLocation(hit.display_name?.split(',')[0] ?? '').replace(/ (district|town)$/, '') ===
      normalizeLocation(query.split(',')[0]).replace(/ (district|town)$/, ''))
    const hit = uniqueMatch(namedBoundaries.length ? namedBoundaries : candidates, (hit) => postal ? query : hit.display_name ?? '', (hit) => [Number(hit.lat), Number(hit.lon)], query, namedBoundaries.length > 0)
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
      boundaryId: postal ? undefined : boundaryId(hit),
    }
  } catch (error) {
    if (error instanceof AmbiguousLocationError) throw error
    return null
  }
}

async function geocodePhoton(query: string, postal?: 'CA' | 'US'): Promise<GeoPoint | null> {
  try {
    const url = `https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(query)}`
    const body = await fetchJson<PhotonResponse>(url, { timeoutMs: postal ? 4000 : 8000 })
    const candidates = postal ? (body.features ?? []).filter(({ properties }) =>
      properties?.countrycode?.toUpperCase() === postal &&
      normalizeLocation(properties?.postcode ?? '') === normalizeLocation(query)) : body.features ?? []
    const namedPlaces = postal ? [] : candidates.filter(({ properties }) =>
      properties?.name && !properties.street && !properties.housenumber &&
      normalizeLocation(properties.name) === normalizeLocation(query.split(',')[0]))
    const feature = uniqueMatch(namedPlaces.length ? namedPlaces : candidates,
      (feature) => postal ? query : photonLabel(feature.properties),
      (feature) => feature.geometry?.coordinates?.slice().reverse(), query, namedPlaces.length > 0)
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

function uniqueMatch<T>(candidates: T[], label: (candidate: T) => string, coordinates: (candidate: T) => number[] | undefined, query: string, preferFirst = false): T | undefined {
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
  if (!first || preferFirst) return first

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
