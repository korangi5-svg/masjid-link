import type { Metadata } from 'next'
import Link from 'next/link'
import { HeartHandshake, Compass, Sprout } from 'lucide-react'
import { PageHeader } from '@/components/site/page-header'
import { QuranQuote } from '@/components/home/quran-quote'
import { primaryButton, secondaryButton } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Our mission is to strengthen the connection between Muslims and their local masjids.',
}

const values = [
  {
    icon: Compass,
    title: 'Our mission',
    body: 'To make it simple for every Muslim to find a masjid, know when prayers and programs happen, and feel at home in their community.',
  },
  {
    icon: HeartHandshake,
    title: 'Community first',
    body: 'We work alongside masjid volunteers and leaders so their information is accurate, up to date, and easy to share.',
  },
  {
    icon: Sprout,
    title: 'Growing together',
    body: 'From new Muslims to lifelong worshippers, we want every person to find a path to learn, serve, and connect.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Bringing hearts back to the masjid"
        description="Connect to Masjid is a community platform that helps Muslims discover local mosques, join events, and grow in faith together."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ul className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-border bg-white p-7 shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-teal">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-navy">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Run a masjid or Islamic centre?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {"We'd love to list your prayer times, programs, and events. Get in touch and we'll help you get set up."}
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
