import { cacheGetOrSet } from '@/lib/ttl-cache'
import { fetchJson } from '@/lib/services/http'

export interface GeoPoint {
  lat: number
  lng: number
  label: string
  city: string
  province: string
  postalCode: string
}

interface NominatimHit {
  lat: string
  lon: string
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    province?: string
    postcode?: string
    country?: string
  }
}

interface PhotonResponse {
  features?: Array<{
    geometry?: { coordinates?: [number, number] }
    properties?: {
      name?: string
      city?: string
      state?: string
      postcode?: string
      country?: string
    }
  }>
}

const GEOCODE_TTL_MS = 1000 * 60 * 60 * 24

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  const key = `geocode:${query.trim().toLowerCase()}`
  return cacheGetOrSet(key, GEOCODE_TTL_MS, async () => {
    const fromNominatim = await geocodeNominatim(query)
    if (fromNominatim) return fromNominatim
    return geocodePhoton(query)
  })
}

async function geocodeNominatim(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`
    const hits = await fetchJson<NominatimHit[]>(url, { timeoutMs: 8000 })
    const hit = hits[0]
    if (!hit) return null
    const address = hit.address ?? {}
    return {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      label: hit.display_name ?? query,
      city: address.city || address.town || address.village || address.municipality || '',
      province: address.state || address.province || '',
      postalCode: address.postcode || '',
    }
  } catch {
    return null
  }
}

async function geocodePhoton(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(query)}`
    const body = await fetchJson<PhotonResponse>(url, { timeoutMs: 8000 })
    const feature = body.features?.[0]
    const coords = feature?.geometry?.coordinates
    if (!coords) return null
    const [lng, lat] = coords
    const props = feature.properties ?? {}
    return {
      lat,
      lng,
      label: [props.name, props.city, props.state, props.country].filter(Boolean).join(', ') || query,
      city: props.city || props.name || '',
      province: props.state || '',
      postalCode: props.postcode || '',
    }
  } catch {
    return null
  }
}
