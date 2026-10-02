import { fetchMosquesInBox } from '@/lib/services/overpass'
import { getOsmStore, type Box } from '@/lib/services/osm-store'

/**
 * Areas loaded ahead of time so searches there never wait on Overpass.
 * Rectangles overlap slightly at their edges; neighbouring countries' masjids inside them are kept too.
 */
export const PRELOAD_REGIONS: { id: string; label: string; box: Box }[] = [
  { id: 'region:uk', label: 'United Kingdom', box: { south: 49.8, west: -8.7, north: 60.9, east: 1.8 } },
  { id: 'region:ca-west', label: 'Western Canada', box: { south: 48.2, west: -141.0, north: 70.0, east: -102.0 } },
  { id: 'region:ca-east', label: 'Eastern Canada', box: { south: 41.6, west: -102.0, north: 63.0, east: -52.6 } },
  { id: 'region:us-west', label: 'Western US', box: { south: 28.9, west: -125.0, north: 49.0, east: -102.0 } },
  { id: 'region:us-central', label: 'Central US', box: { south: 25.8, west: -102.0, north: 49.4, east: -87.0 } },
  { id: 'region:us-east', label: 'Eastern US', box: { south: 24.4, west: -87.0, north: 47.5, east: -66.9 } },
  { id: 'region:us-alaska', label: 'Alaska', box: { south: 51.2, west: -170.0, north: 71.4, east: -129.9 } },
  { id: 'region:us-hawaii', label: 'Hawaii', box: { south: 18.9, west: -160.3, north: 22.3, east: -154.8 } },
]

// Country-sized Overpass queries are slow; give them room (a Vercel function may run up to 300s).
const REGION_TIMEOUT_SEC = 180

export async function preloadRegion(region: (typeof PRELOAD_REGIONS)[number]) {
  const store = getOsmStore()
  if (!store) throw new Error('SUPABASE_SECRET_KEY is not set')
  const masjids = await fetchMosquesInBox(region.box, { timeoutSec: REGION_TIMEOUT_SEC })
  if (!masjids.length) throw new Error(`Overpass returned no masjids for ${region.label}`)
  return store.replaceArea(region.id, region.box, masjids)
}

/** The region refreshed longest ago (never-loaded regions first). */
export async function stalestRegion() {
  const store = getOsmStore()
  if (!store) throw new Error('SUPABASE_SECRET_KEY is not set')
  const ages = await store.coverageAge(PRELOAD_REGIONS.map((r) => r.id))
  return [...PRELOAD_REGIONS].sort((a, b) => (ages.get(b.id) ?? Infinity) - (ages.get(a.id) ?? Infinity))[0]
}
