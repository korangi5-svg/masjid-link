import type { Metadata } from 'next'
import Image from 'next/image'
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
      <section aria-labelledby="about-creator" className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <h2 id="about-creator" className="text-2xl font-bold text-navy">About Me</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            I’m <strong className="text-navy">Mohammad Arif Ul Huda Khan</strong>, the creator of this website. I design and build websites, automate workflows across websites and applications, and develop custom AI agents for independent professionals and businesses. I work with lawyers, consultants, real estate professionals, clinics, and other service-based businesses.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-xl bg-surface p-5">
              <h3 className="font-bold text-navy">Website development</h3>
              <p className="mt-2 text-muted-foreground">I build websites that clearly present your services and make it easy for prospective clients to get in touch, request a consultation, or book an appointment.</p>
            </li>
            <li className="rounded-xl bg-surface p-5">
              <h3 className="font-bold text-navy">Workflow automation</h3>
              <p className="mt-2 text-muted-foreground">I connect websites and business applications to streamline lead capture, client intake, scheduling, and follow-up. For example, a website inquiry can trigger a confirmation, create a record, and notify the right person.</p>
            </li>
            <li className="rounded-xl bg-surface p-5">
              <h3 className="font-bold text-navy">Custom AI agents</h3>
              <p className="mt-2 text-muted-foreground">I develop AI agents that answer common questions using your approved information, collect intake details, and hand off requests to your team when a person needs to respond.</p>
            </li>
          </ul>
          <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">
            Each project starts with how your business operates today. I identify where a website, an automated workflow, or an AI agent can reduce manual work and make it easier for clients to take the next step.
          </p>
          <p className="mt-5 text-muted-foreground"><strong className="text-navy">Have a project in mind?</strong> Get in touch to discuss what you’d like to build or automate.</p>
          <address className="mt-3 flex flex-wrap gap-x-5 gap-y-2 break-all not-italic">
            <a className="font-semibold text-teal underline" href="mailto:mohammad.arifkhan10@outlook.com">mohammad.arifkhan10@outlook.com</a>
            <a className="font-semibold text-teal underline" href="tel:+14169395525">+1 416-939-5525</a>
          </address>
        </div>
        <div aria-labelledby="about-sponsor" className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <a href="https://www.nextwis.ca/" aria-label="Visit NextWis Digital Skills Education">
              <Image
                unoptimized
                src="https://www.nextwis.ca/wp-content/themes/nextwis-complete-v3/assets/images/nextwis-circle.png"
                alt=""
                width={72}
                height={72}
                className="rounded-full object-contain"
              />
            </a>
            <div className="min-w-0 flex-1">
              <h2 id="about-sponsor" className="text-2xl font-bold text-navy">Our Sponsor</h2>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                This website is sponsored by <strong className="text-navy">NextWis Digital Skills Education</strong>, which provides AI-powered digital skills education for students, parents, educators, job seekers, school boards, community centres, and libraries.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy p-5 text-white">
            <div>
              <h3 className="text-lg font-bold">More than coding</h3>
              <p className="mt-1">Build real projects in Python, AI, data science, and automation.</p>
              <p className="mt-1 text-sm text-white/85">Project-based learning · Ages 8–16+</p>
            </div>
            <a href="https://www.nextwis.ca/programs/" className={secondaryButton}>Explore NextWis programs <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>
      <QuranQuote />
    </>
  )
}
