import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { formatEventDate } from '@/lib/services/event-format'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { CommunityEvent, EventCategory } from '@/lib/types'

export const categoryStyles: Record<EventCategory, string> = {
  Prayer: 'bg-brand-blue/10 text-brand-blue',
  Education: 'bg-accent text-teal-dark',
  Youth: 'bg-purple/10 text-purple',
  Family: 'bg-gold/15 text-[#8a5c00]',
  Community: 'bg-navy/10 text-navy',
}

export function EventCard({ event }: { event: CommunityEvent }) {
  const month = formatEventDate(event.date, { weekday: undefined, day: undefined, year: undefined })
  const day = formatEventDate(event.date, { weekday: undefined, month: undefined, year: undefined })

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <time
          dateTime={event.date}
          className="flex size-16 flex-col items-center justify-center rounded-xl bg-navy text-white"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-mint">{month}</span>
          <span className="text-2xl font-extrabold leading-none">{day}</span>
        </time>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', categoryStyles[event.category])}>
          {event.category}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-bold text-navy">
        <Link href={`/events/${event.id}`} className={cn('rounded after:absolute after:inset-0 after:rounded-2xl', focusRing)}>
          {event.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
      <div className="mt-auto flex flex-col gap-1.5 pt-5 text-sm text-foreground/80">
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-teal" aria-hidden="true" />
          {event.startTime} – {event.endTime}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-teal" aria-hidden="true" />
          {event.location}
        </span>
      </div>
    </article>
  )
}
