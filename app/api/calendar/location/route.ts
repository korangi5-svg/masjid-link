import { NextResponse } from 'next/server'
import { geocodeLocation } from '@/lib/services/geocoding'
import { getPrayerTimes } from '@/lib/services/prayer-times'

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get('city')?.trim()
  if (!city || city.length > 120) {
    return NextResponse.json({ error: 'Enter a city name.' }, { status: 400 })
  }

  try {
    const place = await geocodeLocation(city)
    if (!place) {
      return NextResponse.json({ error: 'City not found. Try adding the province or country.' }, { status: 404 })
    }
    const { timezone } = await getPrayerTimes(place.lat, place.lng)
    if (!timezone) throw new Error('Missing time zone')
    const zone = new Intl.DateTimeFormat('en', { timeZone: timezone }).resolvedOptions().timeZone
    return NextResponse.json({ label: place.label, zone })
  } catch {
    return NextResponse.json({ error: 'Could not look up the city time zone. You can select it below.' }, { status: 503 })
  }
}
