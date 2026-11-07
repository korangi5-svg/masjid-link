import { NextResponse } from 'next/server'
import { fetchJson } from '@/lib/services/http'
import { cacheGetOrSet } from '@/lib/ttl-cache'

interface PublicHoliday {
  date: string
  name: string
  global: boolean
  counties: string[] | null
  types: string[]
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const country = params.get('country') ?? ''
  const region = params.get('region')
  const year = Number(params.get('year'))
  if (!/^[A-Z]{2}$/.test(country) || !Number.isInteger(year) || year < 1900 || year > 2100 ||
    (region && (!/^[A-Z]{2}-[A-Z0-9]{1,4}$/.test(region) || !region.startsWith(country + '-')))) {
    return NextResponse.json({ error: 'Invalid holiday jurisdiction or year.' }, { status: 400 })
  }

  try {
    const holidays = await cacheGetOrSet(`public-holidays:${country}:${year}`, 86400000, () =>
      fetchJson<PublicHoliday[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { timeoutMs: 6000 }),
    )
    return NextResponse.json({
      holidays: holidays.filter(holiday => holiday.types.includes('Public') &&
        (holiday.global || Boolean(region && holiday.counties?.includes(region))))
        .map(({ date, name, global }) => ({ date, name, scope: global ? 'National' : 'Regional' })),
    })
  } catch {
    return NextResponse.json({ error: 'Public holiday data is unavailable for this location and year.' }, { status: 502 })
  }
}
