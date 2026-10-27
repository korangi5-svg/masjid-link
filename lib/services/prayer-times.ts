import type { PrayerTimes } from '@/lib/types'
import { cacheGetOrSet } from '@/lib/ttl-cache'
import { fetchJson } from '@/lib/services/http'
import { JUMUAH_UNKNOWN } from '@/lib/prayer'

interface AladhanResponse {
  data?: {
    timings?: {
      Fajr?: string
      Dhuhr?: string
      Asr?: string
      Maghrib?: string
      Isha?: string
    }
    meta?: { timezone?: string }
  }
}

const PRAYER_TTL_MS = 1000 * 60 * 60

export async function getPrayerTimes(lat: number, lng: number): Promise<PrayerTimes> {
  // A timestamp (not the server's UTC date) lets Aladhan pick "today" in the location's own timezone.
  const hour = Math.floor(Date.now() / PRAYER_TTL_MS)
  const key = `prayer:${lat.toFixed(2)}:${lng.toFixed(2)}:${hour}`
  return cacheGetOrSet(key, PRAYER_TTL_MS, async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=2`
    const body = await fetchJson<AladhanResponse>(url, { timeoutMs: 8000 })
    const t = body.data?.timings
    if (!t?.Fajr || !t.Dhuhr || !t.Asr || !t.Maghrib || !t.Isha) {
      throw new Error('Incomplete prayer times')
    }
    return {
      date: new Intl.DateTimeFormat('en-CA', { timeZone: body.data?.meta?.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
      fajr: to12h(t.Fajr),
      dhuhr: to12h(t.Dhuhr),
      asr: to12h(t.Asr),
      maghrib: to12h(t.Maghrib),
      isha: to12h(t.Isha),
      jumuah: JUMUAH_UNKNOWN,
      timezone: body.data?.meta?.timezone,
    }
  })
}

function to12h(raw: string) {
  const [hStr, mStr] = raw.trim().split(' ')[0].split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = ((h + 11) % 12) + 1
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}
