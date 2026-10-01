import { NextResponse, type NextRequest } from 'next/server'
import { isValidCoord } from '@/lib/geo'
import { LocationNotFoundError, searchMasjidsNearby } from '@/lib/services/masjids'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const location = params.get('location')?.trim() ?? ''
  const latRaw = params.get('lat')
  const lngRaw = params.get('lng')
  const radiusRaw = params.get('radiusKm')

  const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : undefined
  const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : undefined
  const radiusKm = radiusRaw ? Number(radiusRaw) : 15

  if (location.length > 100) {
    return NextResponse.json({ error: 'Location is too long.' }, { status: 400 })
  }
  if ((lat != null || lng != null) && (lat == null || lng == null || !isValidCoord(lat, lng))) {
    return NextResponse.json({ error: 'That location looks invalid.' }, { status: 400 })
  }
  if (!location && lat == null) {
    return NextResponse.json({ error: 'Please enter a city or postal code, or share your location.' }, { status: 400 })
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50) {
    return NextResponse.json({ error: 'Choose a distance between 1 and 50 km.' }, { status: 400 })
  }

  try {
    const result = await searchMasjidsNearby({ location, lat, lng, radiusKm })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof LocationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('[masjids/search]', error)
    return NextResponse.json({ error: 'Search is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
