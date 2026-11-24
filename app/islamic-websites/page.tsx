import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/site/page-header'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Islamic Websites',
  description: 'Browse websites for Quran, hadith, Islamic articles, and courses.',
}

const websites = [
  { name: 'Quran.com', href: 'https://quran.com/', description: 'Read the Quran with translations, tafsir, and audio recitations.' },
  { name: 'Sunnah.com', href: 'https://sunnah.com/', description: 'Search hadith collections and find daily duas.' },
  { name: 'Yaqeen Institute', href: 'https://yaqeeninstitute.org/', description: 'Browse articles, lectures, and research on Islam.' },
  { name: 'Dr. Israr Ahmad', href: 'https://www.drisrar.com/', description: 'Explore Quran tafsir, hadith lessons, and lectures in Urdu and English.' },
  { name: 'MuslimMatters', href: 'https://muslimmatters.org/', description: 'Read articles on faith, family, and community life.' },
  { name: 'Madinah Arabic', href: 'https://www.madinaharabic.com/', description: 'Explore Arabic reading and language lessons for beginners.' },
  { name: 'New Muslim Academy', href: 'https://www.newmuslimacademy.org/our-courses/', description: 'Find introductory courses on faith, worship, and daily life.' },
]

export default function IslamicWebsitesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Islamic Websites"
        description="Find websites for reading Quran and hadith, learning Arabic, and exploring Islamic courses and articles."
      />
      <ul className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {websites.map(({ name, href, description }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('block h-full rounded-2xl border border-border bg-white p-5 transition-colors hover:border-teal', focusRing)}
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
                {name}
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
