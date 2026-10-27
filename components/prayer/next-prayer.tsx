'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { DAILY_PRAYERS, formatCountdown, getNextPrayer } from '@/lib/prayer'
import { cn } from '@/lib/utils'
import type { PrayerTimes } from '@/lib/types'
import { AdhanControl } from './adhan-control'

/** Re-renders every 30s so the countdown stays current. Renders nothing until mounted to avoid clock mismatches with the server. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function NextPrayerBar({
  times,
  place,
  tone = 'light',
  className,
  coords,
}: {
  times: PrayerTimes
  place?: string
  tone?: 'light' | 'dark'
  className?: string
  coords?: { lat: number; lng: number }
}) {
  const now = useNow()
  const next = now ? getNextPrayer(times, now) : null
  if (!next) return null

  const dark = tone === 'dark'

  return (
    <div><div
      className={cn(
        'flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        dark ? 'bg-white/10 text-white ring-1 ring-white/15' : 'border border-border bg-white',
        className,
      )}
    >
      <p className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            dark ? 'bg-mint/20 text-mint' : 'bg-accent text-teal-dark',
          )}
        >
          <Clock className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className={cn('block text-xs font-semibold uppercase tracking-wider', dark ? 'text-white/70' : 'text-muted-foreground')}>
            Next prayer{place ? ` · ${place}` : ''}
          </span>
          <span className={cn('block text-lg font-bold', dark ? 'text-white' : 'text-navy')}>
            {next.label} at {next.time}{' '}
            <span className={cn('font-semibold', dark ? 'text-mint' : 'text-teal-dark')}>{formatCountdown(next.minutesUntil)}</span>
          </span>
        </span>
      </p>

      <ol className="flex gap-1 overflow-x-auto text-center text-xs sm:gap-2" aria-label="Today's prayer times">
        {DAILY_PRAYERS.map(({ key, label }) => {
          const active = key === next.key
          return (
            <li
              key={key}
              aria-current={active ? 'time' : undefined}
              className={cn(
                'min-w-14 flex-1 rounded-lg px-2 py-1.5',
                active
                  ? dark
                    ? 'bg-mint text-navy'
                    : 'bg-navy text-white'
                  : dark
                    ? 'text-white/80'
                    : 'text-muted-foreground',
              )}
            >
              <span className="block font-semibold">{label}</span>
              <span className="block tabular-nums">{times[key]}</span>
            </li>
          )
        })}
      </ol>
    </div><AdhanControl times={times} coords={coords} /></div>
  )
}
