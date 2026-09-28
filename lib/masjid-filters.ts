import type { Masjid } from '@/lib/types'

export interface MasjidFilters {
  query?: string
  maxDistanceKm?: number | null
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function filterMasjids(masjids: Masjid[], { query = '', maxDistanceKm = null }: MasjidFilters) {
  const q = normalize(query)
  return masjids
    .filter((m) => {
      if (maxDistanceKm !== null && m.distanceKm > maxDistanceKm) return false
      if (!q) return true
      const textMatch = [m.name, m.city, m.province, m.address].some((field) => normalize(field).includes(q))
      const postal = normalize(m.postalCode)
      const postalMatch = postal.includes(q) || (q.length >= 3 && postal.startsWith(q.slice(0, 3)))
      return textMatch || postalMatch
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
