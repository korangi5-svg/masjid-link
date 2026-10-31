import { Hero } from '@/components/home/hero'
import { FeatureGrid } from '@/components/home/feature-grid'
import { QuranQuote } from '@/components/home/quran-quote'
import { YourArea } from '@/components/home/your-area'
import Link from 'next/link'
import { primaryButton } from '@/lib/site'

export default function HomePage() {
  return (
    <>
      <Hero />
      <YourArea />
      <FeatureGrid />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-3xl bg-surface p-8 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-teal-dark">Five minutes for your faith</p><h2 className="mt-3 text-3xl font-bold text-navy">Your daily moment of learning</h2><p className="my-4 max-w-xl text-muted-foreground">A Quran verse, authentic hadith, dua, reflection, and one small action. A fresh practice each day.</p></div><Link href="/daily-learning" className={primaryButton}>Read today’s lesson</Link></div></section>
      <QuranQuote />
    </>
  )
}
