import { NextResponse } from 'next/server'
import { geocodeLocation } from '@/lib/services/geocoding'
import { fetchJson } from '@/lib/services/http'
import { cacheGetOrSet } from '@/lib/ttl-cache'
import { getPrayerTimes } from '@/lib/services/prayer-times'

interface PublicHoliday {
  date: string
  name: string
  localName: string
  global: boolean
  counties: string[] | null
  types: string[]
}

async function getHolidays(country: string | undefined, region: string | undefined, zone: string) {
  if (!country || !/^[A-Z]{2}$/.test(country)) return null

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const year = Number(today.slice(0, 4))
  try {
    const years = await Promise.all([year, year + 1].map(value =>
      cacheGetOrSet(`public-holidays:${country}:${value}`, 86400000, () =>
        fetchJson<PublicHoliday[]>(`https://date.nager.at/api/v3/PublicHolidays/${value}/${country}`, { timeoutMs: 5000 }),
      ),
    ))
    return years.flat()
      .filter(holiday => holiday.date >= today && holiday.types.includes('Public') &&
        (holiday.global || Boolean(region && holiday.counties?.includes(region))))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map(holiday => ({ date: holiday.date, name: holiday.localName || holiday.name }))
  } catch {
    return null
  }
}

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
    const holidays = await getHolidays(place.countryCode, place.regionCode, zone)
    return NextResponse.json({ label: place.label, zone, holidays, hasRegion: Boolean(place.regionCode) })
  } catch {
    return NextResponse.json({ error: 'Could not look up the city time zone. You can select it below.' }, { status: 503 })
  }
}
