import { NextResponse, type NextRequest } from 'next/server'
import { isValidCoord } from '@/lib/geo'
import { getPrayerTimes } from '@/lib/services/prayer-times'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  if (!params.get('lat') || !params.get('lng') || !isValidCoord(lat, lng)) {
    return NextResponse.json({ error: 'That location looks invalid.' }, { status: 400 })
  }

  try {
    const prayerTimes = await getPrayerTimes(lat, lng)
    return NextResponse.json({ prayerTimes })
  } catch (error) {
    console.error('[prayer-times]', error)
    return NextResponse.json({ error: 'Prayer times are temporarily unavailable.' }, { status: 502 })
  }
}
