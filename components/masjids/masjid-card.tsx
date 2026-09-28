import Link from 'next/link'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { MosqueIcon } from '@/components/icons/mosque-icon'
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
        {masjid.address}, {masjid.city}, {masjid.postalCode}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0 text-teal" aria-hidden="true" />
        {"Jumu'ah"} at {masjid.prayerTimes.jumuah}
      </p>
      <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-teal" aria-hidden="true">
        View details <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </article>
  )
}
