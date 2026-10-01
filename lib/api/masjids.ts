import type { Masjid } from '@/lib/types'

export interface MasjidSearchParams {
  location?: string
  lat?: number
  lng?: number
  radiusKm?: number
}

export interface MasjidSearchResult {
  origin: { lat: number; lng: number; label?: string } | null
  masjids: Masjid[]
}

export async function searchMasjids(params: MasjidSearchParams): Promise<MasjidSearchResult> {
  const query = new URLSearchParams()
  if (params.location) query.set('location', params.location)
  if (params.lat != null) query.set('lat', String(params.lat))
  if (params.lng != null) query.set('lng', String(params.lng))
  if (params.radiusKm != null) query.set('radiusKm', String(params.radiusKm))

  const res = await fetch(`/api/masjids/search?${query.toString()}`)
  const body = (await res.json()) as Partial<MasjidSearchResult> & { error?: string }
  if (!res.ok) throw new Error(body.error ?? 'Search failed')
  return { origin: body.origin ?? null, masjids: body.masjids ?? [] }
}
