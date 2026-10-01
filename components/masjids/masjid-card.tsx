import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Navigation } from 'lucide-react'
import { MosqueIcon } from '@/components/icons/mosque-icon'
import { directionsUrl } from '@/lib/geo'
import { hasRealTime } from '@/lib/prayer'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Masjid } from '@/lib/types'

export function MasjidCard({ masjid }: { masjid: Masjid }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
          <MosqueIcon className="size-6" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-teal-dark">{masjid.distanceKm} km away</span>
      </div>
      <h2 className="mt-4 text-lg font-bold text-navy">
        <Link href={`/masjids/${masjid.id}`} className={cn('rounded after:absolute after:inset-0 after:rounded-2xl', focusRing)}>
          {masjid.name}
        </Link>
      </h2>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
        {[masjid.address, masjid.city, masjid.postalCode].filter(Boolean).join(', ')}
      </p>
      {hasRealTime(masjid.prayerTimes.jumuah) ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0 text-teal" aria-hidden="true" />
          Jumu&apos;ah at {masjid.prayerTimes.jumuah}
        </p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="flex items-center gap-1 text-sm font-semibold text-teal-dark" aria-hidden="true">
          View details <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
        <a
          href={directionsUrl(masjid.latitude, masjid.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${masjid.name}`}
          className={cn(
            'relative z-10 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue',
            focusRing,
          )}
        >
          <Navigation className="size-4" aria-hidden="true" /> Directions
        </a>
      </div>
    </article>
  )
}

export function MasjidCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col rounded-2xl border border-border bg-white p-6">
      <div className="flex items-start justify-between">
        <span className="size-12 rounded-full bg-surface" />
        <span className="h-6 w-20 rounded-full bg-surface" />
      </div>
      <span className="mt-5 h-5 w-3/4 rounded bg-surface" />
      <span className="mt-3 h-4 w-full rounded bg-surface" />
      <span className="mt-2 h-4 w-2/3 rounded bg-surface" />
      <span className="mt-6 h-9 w-full rounded-full bg-surface" />
    </div>
  )
}
