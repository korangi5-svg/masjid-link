import { NextResponse, type NextRequest } from 'next/server'
import { searchMasjidsByLocation } from '@/lib/services/masjids'

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location')?.trim() ?? ''

  if (!location) {
    return NextResponse.json({ error: 'Please enter a city or postal code.' }, { status: 400 })
  }
  if (location.length > 100) {
    return NextResponse.json({ error: 'Location is too long.' }, { status: 400 })
  }

  const masjids = await searchMasjidsByLocation(location)
  return NextResponse.json({ masjids })
}
