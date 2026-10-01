import type { PrayerTimes } from '@/lib/types'

// Jumu'ah varies by masjid, so calculated times never claim one.
export const JUMUAH_UNKNOWN = 'Check with masjid'

export const DAILY_PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const

export type DailyPrayerKey = (typeof DAILY_PRAYERS)[number]['key']

export interface NextPrayer {
  key: DailyPrayerKey
  label: string
  time: string
  minutesUntil: number
}

export function hasRealTime(value: string) {
  return parseClock(value) != null
}

/** Next of the five daily prayers, judged by the clock in the times' own timezone. */
export function getNextPrayer(times: PrayerTimes, now = new Date()): NextPrayer | null {
  const nowMinutes = minutesInZone(now, times.timezone)
  let first: NextPrayer | null = null

  for (const { key, label } of DAILY_PRAYERS) {
    const at = parseClock(times[key])
    if (at == null) return null
    const prayer = { key, label, time: times[key], minutesUntil: at - nowMinutes }
    first ??= prayer
    if (at > nowMinutes) return prayer
  }

  // After Isha: tomorrow's Fajr (today's time is a close enough estimate).
  return first && { ...first, minutesUntil: first.minutesUntil + 24 * 60 }
}

export function formatCountdown(minutes: number) {
  if (minutes < 1) return 'now'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `in ${m} min`
  return m ? `in ${h} hr ${m} min` : `in ${h} hr`
}

/** "5:57 AM" → minutes after midnight. */
function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim())
  if (!match) return null
  const hour = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return hour * 60 + Number(match[2])
}

function minutesInZone(date: Date, timeZone?: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date)
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    return get('hour') * 60 + get('minute')
  } catch {
    return date.getHours() * 60 + date.getMinutes()
  }
}
