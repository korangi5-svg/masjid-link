import type { Metadata } from 'next'
import Link from 'next/link'
import { BookMarked, BookOpen, GraduationCap, HandHeart, Newspaper, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/site/page-header'
import { getResourceCategories } from '@/lib/services/resources'
import { focusRing, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { ResourceCategoryId } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Islamic Resources',
  description: 'Helpful guides to the Quran, Hadith, Dua, Islamic articles, and educational resources.',
}

const icons: Record<ResourceCategoryId, { icon: typeof BookOpen; color: string }> = {
  quran: { icon: BookOpen, color: 'bg-brand-blue' },
  hadith: { icon: BookMarked, color: 'bg-teal' },
  dua: { icon: HandHeart, color: 'bg-gold' },
  articles: { icon: Newspaper, color: 'bg-purple' },
  education: { icon: GraduationCap, color: 'bg-navy' },
}

export default async function ResourcesPage() {
  const categories = await getResourceCategories()

  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Islamic resources"
        description="Trusted places to read, listen, and learn — for new Muslims, families, and lifelong students of knowledge."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-bold text-navy">Find your next lecture, article, course, or podcast</h2><p className="mt-2 text-sm text-muted-foreground">Search our learning library and discover recommendations shaped by your interests.</p><Link href="/learn" className={cn(secondaryButton, 'mt-4')}>Explore the learning library</Link></div>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const { icon: Icon, color } = icons[c.id] ?? icons.education
            return (
              <li key={c.id} id={c.id} className="scroll-mt-32">
                <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <span className={cn('flex size-12 items-center justify-center rounded-full text-white', color)}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-navy">{c.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                  <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn('group flex items-start justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-surface', focusRing)}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-navy group-hover:text-teal">{l.title}</span>
                            <span className="block text-xs text-muted-foreground">{l.description}</span>
                          </span>
                          <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}

