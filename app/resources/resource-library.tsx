'use client'
import Link from 'next/link'
import { BookMarked, BookOpen, GraduationCap, HandHeart, Newspaper, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { indexResources } from '@/lib/resource-library'
import { focusRing, inputClass, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { ResourceCategory, ResourceCategoryId } from '@/lib/types'

const icons: Record<ResourceCategoryId, { icon: typeof BookOpen; color: string }> = {
  quran: { icon: BookOpen, color: 'bg-brand-blue' },
  hadith: { icon: BookMarked, color: 'bg-teal' },
  dua: { icon: HandHeart, color: 'bg-gold' },
  articles: { icon: Newspaper, color: 'bg-purple' },
  education: { icon: GraduationCap, color: 'bg-navy' },
}

export function ResourceLibrary({ categories }: { categories: ResourceCategory[] }) {
  const [query, setQuery] = useState('')
  const resources = useMemo(() => indexResources(categories), [categories])
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const results = resources.filter((resource) => terms.every((term) => resource.searchText.includes(term)))

  return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-bold text-navy">Find your next lecture, article, course, or podcast</h2><p className="mt-2 text-sm text-muted-foreground">Search our learning library and discover recommendations shaped by your interests.</p><Link href="/learn" className={cn(secondaryButton, 'mt-4')}>Explore the learning library</Link></div>
        <div role="search" className="mb-6">
          <label htmlFor="resource-search" className="mb-2 block font-semibold text-navy">Search Islamic resources</label>
          <input id="resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} />
          <p role="status" className="mt-2 text-sm text-muted-foreground">{results.length} resources found.</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const links = results.filter((resource) => resource.category === c.id)
            if (terms.length && !links.length) return null
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
                    {links.map((l) => (
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
                        {l.tags.length > 0 && <p className="px-0 text-xs text-muted-foreground">{l.tags.join(' · ')}</p>}
                        {l.related.length > 0 && (
                          <div className="mt-2"><p className="text-xs font-semibold text-navy">Related resources</p><ul aria-label={'Related to ' + l.title} className="mt-1 flex flex-wrap gap-x-3 text-xs">
                            {l.related.map((item) => (
                              <li key={item.href}><a className={cn("text-teal-dark underline", focusRing)} href={item.href} target="_blank" rel="noopener noreferrer">{item.title}<span className="sr-only"> (opens in a new tab)</span></a></li>
                            ))}
                          </ul></div>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            )
          })}
        </ul>
      </section>

  )
}



