import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { eventsEnabled } from '@/lib/features'
import { contentCatalog, scholars } from '@/lib/recommendations'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Find pages and learning resources on Masjid Link.',
  robots: { index: false, follow: true },
}

const pages = [
  { title: 'Hijri and Gregorian Calendar', href: '/calendar', description: 'View Islamic and English calendar dates for your location and time zone.' },
  { title: 'Find a Masjid', href: '/masjids', description: 'Find mosques, prayer times, and Jumuah by city or postal code.' },
  { title: 'Community Discussions', href: '/discussions', description: 'Join the discussion, share a post, and read community replies.' },
  { title: 'Find Your Community', href: '/community', description: 'Find community groups by city, language, age bracket, or learning goals.' },
  { title: 'Learning Library', href: '/learn', description: 'Browse Islamic lectures, articles, courses, and podcasts.' },
  { title: 'Daily Learning', href: '/daily-learning', description: 'Read a daily Quran verse, hadith, dua, and reflection.' },
  { title: 'New Muslim Learning Path', href: '/learning-path', description: 'Learn about Shahadah, prayer, wudu, and Quran basics.' },
  { title: 'Questions and Answers', href: '/questions', description: 'Find answers about faith, prayer, purification, and community.' },
  { title: 'Resources', href: '/resources', description: 'Explore the Quran, hadith, articles, and educational resources.' },
  { title: 'Scholars', href: '/scholars', description: 'Find and follow scholars.' },
  { title: 'Events', href: '/events', description: 'Browse community events and classes.' },
  { title: 'About Masjid Link', href: '/about', description: 'Learn about Connect to Masjid and its community.' },
  { title: 'Contact', href: '/contact', description: 'Contact Masjid Link with a question, suggestion, or request.' },
].filter(page => eventsEnabled || page.href !== '/events')

const entries = [
  ...pages.map(page => ({ ...page, kind: 'Page', keywords: '' })),
  ...contentCatalog.map(item => ({ ...item, keywords: [item.publisher, ...item.interests].join(' ') })),
  ...scholars.map(scholar => ({ title: scholar.name, description: scholar.description, href: '/scholars', kind: 'Scholar', keywords: '' })),
]

function normalize(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q.slice(0, 100).trim() : ''
  const terms = [...new Set(normalize(query).split(' ').filter(Boolean))]
  const results = terms.length ? entries.flatMap(entry => {
    const title = normalize(entry.title)
    const searchable = normalize([entry.title, entry.description, entry.kind, entry.keywords].join(' '))
    if (!terms.every(term => searchable.includes(term))) return []
    const score = terms.filter(term => title.includes(term)).length * 3 + (title.includes(terms.join(' ')) ? 4 : 0)
    return [{ entry, score }]
  }).sort((a, b) => b.score - a.score).slice(0, 20) : []

  return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <h1 className="text-4xl font-bold text-navy">Search Masjid Link</h1>
    <p className="mt-3 text-muted-foreground">Find site pages, scholars, and learning resources.</p>
    <form role="search" action="/search" method="get" className="mt-7">
      <label htmlFor="site-search" className="mb-2 block font-semibold">Search the website</label>
      <div className="flex flex-wrap gap-3 sm:flex-nowrap">
        <input id="site-search" name="q" type="search" defaultValue={query} maxLength={100} required placeholder="Try community discussions or Quran" className={inputClass} />
        <button type="submit" className={primaryButton}><Search className="size-4" aria-hidden="true" />Search</button>
      </div>
    </form>
    <section aria-label="Search results" className="mt-8">
      {query ? <>
        <h2 className="text-2xl font-bold text-navy">Results for “{query}”</h2>
        {results.length ? <ul className="mt-4 space-y-3">{results.map(({ entry }) =>
          <li key={entry.title + entry.href} className="rounded-xl border border-border p-5">
            <span className="text-sm font-semibold capitalize text-teal-dark">{entry.kind}</span>
            <h3 className="mt-1 font-semibold"><Link href={entry.href} className="text-navy underline decoration-teal underline-offset-4">{entry.title}</Link></h3>
            <p className="mt-2 text-muted-foreground">{entry.description}</p>
          </li>
        )}</ul> : <p className="mt-4">No results found. Try a shorter search, or use the masjid directory to search by location.</p>}
        <Link href="/masjids" className={`${secondaryButton} mt-6`}>Find a masjid by location</Link>
      </> : <>
        <h2 className="text-2xl font-bold text-navy">Quick links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/discussions" className={secondaryButton}>Community Discussions</Link>
          <Link href="/community" className={secondaryButton}>Community Groups</Link>
          <Link href="/masjids" className={secondaryButton}>Find a Masjid</Link>
          <Link href="/learn" className={secondaryButton}>Learning Library</Link>
        </div>
      </>}
    </section>
  </div>
}
