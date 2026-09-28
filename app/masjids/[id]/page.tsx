import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, MapPin, Navigation, Phone } from 'lucide-react'
import { PrayerTimesTable } from '@/components/masjids/prayer-times-table'
import { getMasjidById } from '@/lib/services/masjids'
import { getEvents, formatEventDate } from '@/lib/services/events'
import { focusRing, primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const masjid = await getMasjidById(id)
  return masjid ? { title: masjid.name, description: masjid.description } : { title: 'Masjid not found' }
}

export default async function MasjidDetailPage({ params }: Props) {
  const { id } = await params
  const [masjid, events] = await Promise.all([getMasjidById(id), getEvents()])
  if (!masjid) notFound()

  const upcoming = events.filter((e) => e.masjidId === masjid.id)
  const fullAddress = `${masjid.address}, ${masjid.city}, ${masjid.province} ${masjid.postalCode}`
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${masjid.name} ${fullAddress}`)}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/masjids" className={cn('inline-flex items-center gap-1.5 rounded text-sm font-semibold text-teal hover:underline', focusRing)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All masjids
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{masjid.name}</h1>
          <p className="mt-3 flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" /> {fullAddress}
          </p>
          <p className="mt-6 text-pretty leading-relaxed text-foreground/85">{masjid.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={primaryButton}>
              <Navigation className="size-4" aria-hidden="true" /> Get directions
            </a>
            <a href={`tel:${masjid.phone.replace(/\D/g, '')}`} className={secondaryButton}>
              <Phone className="size-4" aria-hidden="true" /> {masjid.phone}
            </a>
          </div>

          <h2 className="mt-10 text-xl font-bold text-navy">Services</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {masjid.services.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-foreground/85">
                <Check className="size-4 text-teal" aria-hidden="true" /> {s}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-xl font-bold text-navy">Upcoming events</h2>
          {upcoming.length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className={cn('flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface', focusRing)}
                  >
                    <CalendarDays className="size-5 shrink-0 text-teal" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-navy">{e.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {formatEventDate(e.date)} · {e.startTime}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming events listed for this masjid.</p>
          )}
        </div>

        <aside>
          <PrayerTimesTable times={masjid.prayerTimes} />
        </aside>
      </div>
    </div>
  )
}
