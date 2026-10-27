'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { NextPrayerBar } from '@/components/prayer/next-prayer'
import { clearSavedArea, loadSavedArea, type SavedArea } from '@/lib/saved-area'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { PrayerTimes } from '@/lib/types'

/** For returning visitors: today's next prayer and a shortcut to masjids near their last-searched area. */
export function YourArea() {
  const [area, setArea] = useState<SavedArea | null>(null)
  const [times, setTimes] = useState<PrayerTimes | null>(null)

  useEffect(() => {
    const saved = loadSavedArea()
    if (!saved) return
    setArea(saved)
    const controller = new AbortController()
    fetch(`/api/prayer-times?lat=${saved.lat}&lng=${saved.lng}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { prayerTimes?: PrayerTimes } | null) => setTimes(body?.prayerTimes ?? null))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  if (!area) return null

  const href = `/masjids?lat=${area.lat}&lng=${area.lng}&near=${encodeURIComponent(area.label)}`

  return (
    <section aria-label="Your area" className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 lg:px-8">
        {times ? <NextPrayerBar times={times} coords={area} place={area.label} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link href={href} className={cn('inline-flex items-center gap-1 rounded font-semibold text-teal-dark hover:underline', focusRing)}>
            Masjids near {area.label} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => {
              clearSavedArea()
              setArea(null)
            }}
            className={cn('inline-flex items-center gap-1 rounded text-muted-foreground hover:text-navy', focusRing)}
          >
            <X className="size-3.5" aria-hidden="true" /> Forget this area
          </button>
        </div>
      </div>
    </section>
  )
}
