'use client'

import { useNow } from '@/components/prayer/next-prayer'
import { formatCountdown, getNextPrayer, hasRealTime } from '@/lib/prayer'
import { cn } from '@/lib/utils'
import type { PrayerTimes } from '@/lib/types'

const rows: { key: Exclude<keyof PrayerTimes, 'timezone'>; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
  { key: 'jumuah', label: "Jumu'ah" },
]

export function PrayerTimesTable({ times }: { times: PrayerTimes }) {
  const now = useNow()
  const next = now ? getNextPrayer(times, now) : null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="bg-navy px-6 py-4">
        <h2 className="text-lg font-bold text-white">Today’s prayer times</h2>
        <p className="text-sm text-white/75">
          Start (adhan) times calculated for this location. Congregation (iqamah) times vary — confirm with the masjid.
        </p>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Today’s prayer start times</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Prayer</th>
            <th scope="col">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const isNext = next?.key === r.key
            const known = hasRealTime(times[r.key] ?? '')
            return (
              <tr key={r.key} aria-current={isNext ? 'time' : undefined} className={cn(isNext && 'bg-accent', r.key === 'jumuah' && 'bg-surface')}>
                <th scope="row" className="px-6 py-3.5 text-left font-medium text-navy">
                  {r.label}
                  {isNext ? (
                    <span className="ml-2 rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
                      Next · {formatCountdown(next.minutesUntil)}
                    </span>
                  ) : null}
                </th>
                <td
                  className={cn(
                    'px-6 py-3.5 text-right',
                    known ? 'font-semibold tabular-nums text-teal-dark' : 'text-muted-foreground',
                  )}
                >
                  {times[r.key]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
