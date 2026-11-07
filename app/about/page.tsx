import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Compass, MapPin, Sprout } from 'lucide-react'
import { PageHeader } from '@/components/site/page-header'
import { QuranQuote } from '@/components/home/quran-quote'
import { eventsEnabled } from '@/lib/features'
import { primaryButton, secondaryButton } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Find nearby masjids, check local prayer times, discover community programs, and find services for your trip or daily life.',
}

const guides = [
  {
    icon: Compass,
    title: 'Find a masjid and plan your prayer',
    body: 'Whether you are at home or travelling, search by city, address, postal code, or current location. Check prayer times for the area and contact the masjid to confirm its congregational prayer times before you go.',
    href: '/masjids',
    linkLabel: 'Find masjids',
  },
  {
    icon: CalendarDays,
    title: 'Take part in local programs',
    body: 'Browse listed daily and weekly programs, such as classes and community gatherings, to see when and where you can take part.',
    href: '/events',
    linkLabel: 'Browse events',
    enabled: eventsEnabled,
  },
  {
    icon: Sprout,
    title: 'Make time to learn',
    body: 'Whether you are new to Islam or want to build a regular learning habit, explore a short daily lesson with a Quran verse, hadith, dua, and reflection.',
    href: '/daily-learning',
    linkLabel: 'Explore Daily Learning',
  },
  {
    icon: MapPin,
    title: 'Find services near home or away',
    body: 'Choose your area or travel destination to find travel agents, car rentals, lawyers, real estate agents, halal food, and other essentials. Open the results in Google Maps for available phone numbers and websites.',
    href: '/local-services',
    linkLabel: 'Explore Local Services',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Find a masjid wherever you are"
        description="Connect to Masjid helps Muslims find a place to pray, check local prayer times, and join masjid programs. Use it to get to know your local community or plan a visit in an unfamiliar city."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-navy">What you can do on Connect to Masjid</h2>
        <ul className="grid gap-6 md:grid-cols-2">
          {guides.filter((guide) => guide.enabled !== false).map(({ icon: Icon, title, body, href, linkLabel }) => (
            <li key={title} className="flex flex-col items-start rounded-2xl border border-border bg-white p-7 shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-teal">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-navy">{title}</h3>
              <p className="mt-2 grow leading-relaxed text-muted-foreground">{body}</p>
              <Link href={href} className={`mt-5 ${secondaryButton}`}>{linkLabel}</Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Run a masjid or Islamic centre?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Share your location, prayer schedule, and upcoming programs so visitors can plan their visit. If your masjid is already listed, contact us to correct or update its details.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className={primaryButton}>
              Contact us
            </Link>
            <Link href="/masjids" className={secondaryButton}>
              Browse masjids
            </Link>
          </div>
        </div>
      </section>
      <QuranQuote />
    </>
  )
}
