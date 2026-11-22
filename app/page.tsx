import type { Metadata } from 'next'
import { Hero } from '@/components/home/hero'
import { FeatureGrid } from '@/components/home/feature-grid'
import { QuranQuote } from '@/components/home/quran-quote'
import { YourArea } from '@/components/home/your-area'
import Link from 'next/link'
import { primaryButton } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'Connect to Masjid | Find Local Mosques & Prayer Times' },
  description: 'Find local masjids, check prayer times, and explore community events and Islamic resources with Connect to Masjid.',
  verification: { google: 'S9wXXFIoJ5wlUMcHVf6HCru6G6DNGKkCc7Vt0NlCOjw' },
  alternates: { canonical: 'https://masjid-link.vercel.app/' },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <YourArea />
      <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h2 className="inline-block rounded-t-lg bg-navy px-4 py-2 text-2xl font-bold text-white">Connect to Masjid Assistant</h2>
          <p className="mt-1 text-muted-foreground">Find prayer times, get around the site, or look up an Islamic question.</p>
        </div>
        {/* Load a new document so the assistant’s microphone policy takes effect. */}
        <a href="/assistant" className={primaryButton}>Open Assistant</a>
      </section>
      <FeatureGrid />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-3xl bg-surface p-8 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-teal-dark">Five minutes for your faith</p><h2 className="mt-3 text-3xl font-bold text-navy">Your daily moment of learning</h2><p className="my-4 max-w-xl text-muted-foreground">A Quran verse, authentic hadith, dua, reflection, and one small action. A fresh practice each day.</p></div><Link href="/daily-learning" className={primaryButton}>Read today’s lesson</Link></div></section>
      <QuranQuote />
    </>
  )
}
