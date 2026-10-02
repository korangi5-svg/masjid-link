import { NextResponse, type NextRequest } from 'next/server'
import { preloadRegion, stalestRegion } from '@/lib/services/osm-preload'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Runs daily (vercel.json) and refreshes the stalest preloaded region, so each is re-fetched about weekly.
// Vercel sends `Authorization: Bearer $CRON_SECRET` with cron requests; anything else is rejected.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  try {
    const region = await stalestRegion()
    const count = await preloadRegion(region)
    return NextResponse.json({ region: region.label, masjids: count, seconds: Math.round((Date.now() - started) / 1000) })
  } catch (error) {
    console.error('[cron/refresh-masjids]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Refresh failed' }, { status: 500 })
  }
}
