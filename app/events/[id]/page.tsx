import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock, MapPin } from 'lucide-react'
import { categoryStyles } from '@/components/events/event-card'
import { getEventById } from '@/lib/services/events'
import { formatEventDate } from '@/lib/services/event-format'
import { focusRing, primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEventById(id)
  return event ? { title: event.title, description: event.description } : { title: 'Event not found' }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)
  if (!event) notFound()

  const details = [
    { icon: CalendarDays, label: 'Date', value: formatEventDate(event.date, { weekday: 'long', month: 'long' }) },
    { icon: Clock, label: 'Time', value: `${event.startTime} – ${event.endTime}` },
    { icon: MapPin, label: 'Location', value: event.location },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/events" className={cn('inline-flex items-center gap-1.5 rounded text-sm font-semibold text-teal-dark hover:underline', focusRing)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All events
      </Link>

      <article className="mt-6">
        <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', categoryStyles[event.category])}>
          {event.category}
        </span>
        <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{event.title}</h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground/85">{event.description}</p>

        <dl className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium text-navy">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-xl font-bold text-navy">About this event</h2>
        <p className="mt-3 text-pretty leading-relaxed text-foreground/85">{event.details}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/masjids/${event.masjidId}`} className={primaryButton}>
            View masjid
          </Link>
          <Link href="/events" className={secondaryButton}>
            More events
          </Link>
        </div>
      </article>
    </div>
  )
}
