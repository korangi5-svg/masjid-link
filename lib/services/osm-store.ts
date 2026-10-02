import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { OsmElementType, OsmMasjid } from '@/lib/services/overpass'

/** south, west, north, east in degrees — the order Overpass uses. */
export interface Box {
  south: number
  west: number
  north: number
  east: number
}

// How long fetched areas are trusted before a search goes back to Overpass.
const COVERAGE_FRESH_MS = 1000 * 60 * 60 * 24 * 14
const UPSERT_BATCH = 500

interface OsmMasjidRow {
  osm_type: OsmElementType
  osm_id: number
  name: string
  lat: number
  lng: number
  address: string
  city: string
  province: string
  postal_code: string
  phone: string | null
  website: string | null
  description: string
  services: string[]
  updated_at?: string
}

export function circleBox(lat: number, lng: number, radiusKm: number): Box {
  const dLat = radiusKm / 111.32
  const dLng = radiusKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01))
  return { south: lat - dLat, west: lng - dLng, north: lat + dLat, east: lng + dLng }
}

/** Grow a box outward to a grid so nearby searches share the same fetched area. */
export function snapBox(box: Box, step = 0.25): Box {
  const down = (v: number) => Math.floor(v / step) * step
  const up = (v: number) => Math.ceil(v / step) * step
  return { south: down(box.south), west: down(box.west), north: up(box.north), east: up(box.east) }
}

export function boxId(box: Box) {
  return `box:${box.south},${box.west},${box.north},${box.east}`
}

/** Null when the server has no secret key — searches then work without the shared cache. */
export function getOsmStore() {
  const db = getSupabaseAdmin()
  return db ? createStore(db) : null
}

export type OsmStore = ReturnType<typeof createStore>

function createStore(db: SupabaseClient) {
  return {
    /** True when fresh coverage rectangles span every corner of the box (and so the whole box, for our tiling). */
    async isCovered(box: Box): Promise<boolean> {
      const since = new Date(Date.now() - COVERAGE_FRESH_MS).toISOString()
      const { data, error } = await db
        .from('osm_coverage')
        .select('south, west, north, east')
        .gte('fetched_at', since)
        .lte('south', box.north)
        .gte('north', box.south)
        .lte('west', box.east)
        .gte('east', box.west)
      if (error) throw new Error(error.message)
      const areas = data as Box[]
      const corners = [
        [box.south, box.west],
        [box.south, box.east],
        [box.north, box.west],
        [box.north, box.east],
      ]
      return corners.every(([lat, lng]) => areas.some((a) => lat >= a.south && lat <= a.north && lng >= a.west && lng <= a.east))
    },

    async query(box: Box): Promise<OsmMasjid[]> {
      const { data, error } = await db
        .from('osm_masjids')
        .select('*')
        .gte('lat', box.south)
        .lte('lat', box.north)
        .gte('lng', box.west)
        .lte('lng', box.east)
        .limit(2000)
      if (error) throw new Error(error.message)
      return (data as OsmMasjidRow[]).map(fromRow)
    },

    /**
     * Replace everything stored inside `box` with a complete Overpass result for it, then mark the box covered.
     * Rows in the box that weren't refreshed have been removed from OpenStreetMap, so they're deleted.
     */
    async replaceArea(coverageId: string, box: Box, masjids: OsmMasjid[]) {
      const startedAt = new Date().toISOString()
      const rows = dedupeById(masjids).map((m) => ({ ...toRow(m), updated_at: startedAt }))
      for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
        const { error } = await db.from('osm_masjids').upsert(rows.slice(i, i + UPSERT_BATCH))
        if (error) throw new Error(error.message)
      }

      const { error: deleteError } = await db
        .from('osm_masjids')
        .delete()
        .lt('updated_at', startedAt)
        .gte('lat', box.south)
        .lte('lat', box.north)
        .gte('lng', box.west)
        .lte('lng', box.east)
      if (deleteError) throw new Error(deleteError.message)

      const { error: coverageError } = await db
        .from('osm_coverage')
        .upsert({ id: coverageId, ...box, fetched_at: startedAt })
      if (coverageError) throw new Error(coverageError.message)
      return rows.length
    },

    async getById(type: OsmElementType, osmId: number): Promise<OsmMasjid | null> {
      const { data, error } = await db.from('osm_masjids').select('*').eq('osm_type', type).eq('osm_id', osmId).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? fromRow(data as OsmMasjidRow) : null
    },

    async coverageAge(ids: string[]): Promise<Map<string, number>> {
      const { data, error } = await db.from('osm_coverage').select('id, fetched_at').in('id', ids)
      if (error) throw new Error(error.message)
      return new Map((data as { id: string; fetched_at: string }[]).map((r) => [r.id, Date.now() - Date.parse(r.fetched_at)]))
    },
  }
}

function dedupeById(masjids: OsmMasjid[]) {
  return [...new Map(masjids.map((m) => [`${m.osmType}:${m.osmId}`, m])).values()]
}

function toRow(m: OsmMasjid): OsmMasjidRow {
  return {
    osm_type: m.osmType,
    osm_id: m.osmId,
    name: m.name,
    lat: m.lat,
    lng: m.lng,
    address: m.address,
    city: m.city,
    province: m.province,
    postal_code: m.postalCode,
    phone: m.phone ?? null,
    website: m.website ?? null,
    description: m.description,
    services: m.services,
  }
}

function fromRow(r: OsmMasjidRow): OsmMasjid {
  return {
    osmType: r.osm_type,
    osmId: Number(r.osm_id),
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    address: r.address,
    city: r.city,
    province: r.province,
    postalCode: r.postal_code,
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    description: r.description,
    services: r.services,
  }
}
