'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { contentCatalog, contentKinds, scholars, type ContentKind } from '@/lib/recommendations'
import { interestLabel } from '@/lib/interests'
import { searchTopics } from '@/lib/recommendation-engine'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'
import { ContentCard, formatLabels } from './content-card'
import { ActivityControls } from './activity-controls'
import { useLearningActivity } from './use-learning-activity'

export function LearningLibrary() {
  const state = useLearningActivity()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<ContentKind | 'all'>('all')
  const [searchStatus, setSearchStatus] = useState('')
  const results = contentCatalog.filter((item) => {
    const text = [item.title, item.description, item.publisher, ...item.interests.map(interestLabel), ...scholars.filter((scholar) => item.scholarIds.includes(scholar.id)).map((scholar) => scholar.name)].join(' ').toLowerCase()
    return (kind === 'all' || item.kind === kind) && search.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word))
  })
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = query.trim().slice(0, 100)
    setSearch(value)
    setSearchStatus('')
    if (value && searchTopics(value).length && state.user && state.activity.enabled) {
      if (await state.save({ type: 'search', query: value })) setSearchStatus('Matching topic preferences updated. Your search text was not saved.')
    }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-dark">Pray · Learn · Connect</p>
      <h1 className="mt-3 text-4xl font-extrabold text-navy">Find your next inspiration</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Explore lectures, articles, courses, and podcasts. Search a topic or scholar to find something meaningful for your journey.</p>
      <Link href="/dashboard" className={`${secondaryButton} mt-5`}>My recommendations</Link>
      <ActivityControls state={state} />
      <form onSubmit={submit} role="search" className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><label htmlFor="learning-search" className="mb-2 block text-sm font-semibold text-navy">Search topics, titles, or scholars</label><input id="learning-search" type="search" maxLength={100} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Quran, parenting, Omar Suleiman" className={inputClass} /></div><button type="submit" disabled={state.saving} className={primaryButton}>Search</button>{search && <button type="button" className={secondaryButton} onClick={() => { setQuery(''); setSearch(''); setSearchStatus('') }}>Clear search</button>}</form>
      {searchStatus && <p role="status" className="mt-3 text-sm text-teal-dark">{searchStatus}</p>}
      <div className="my-6 flex flex-wrap gap-2" role="group" aria-label="Content format">{(['all', ...contentKinds] as const).map((value) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={kind === value ? primaryButton : secondaryButton}>{value === 'all' ? 'All formats' : `${formatLabels[value]}s`}</button>)}</div>
      <p role="status" className="mb-4 text-sm text-muted-foreground">{results.length} {results.length === 1 ? 'resource' : 'resources'} found{search ? ` for “${search}”` : ''}.</p>
      {results.length ? <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{results.map((item) => <li key={item.id}><ContentCard item={item} state={state} /></li>)}</ul> : <div className="rounded-2xl border border-border p-8 text-center"><h2 className="text-xl font-bold text-navy">No matching resources yet</h2><p className="mt-3 text-muted-foreground">Try a broader topic or choose another format.</p></div>}
    </div>
  )
}
