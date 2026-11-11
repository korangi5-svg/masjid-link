'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { secondaryButton } from '@/lib/site'

type Metric = { label: string; count: number; change?: number }
type Report = Record<'topics' | 'unanswered' | 'trending' | 'scholars', Metric[]>

const sections = [
  { key: 'topics', title: 'Most searched topics', detail: 'Members who searched each recognized library topic in the last 28 days.' },
  { key: 'unanswered', title: 'Unanswered searches', detail: 'Recognized topics with no matching library resource in the last 28 days.' },
  { key: 'trending', title: 'Trending questions', detail: 'Question categories with more submissions this week than the previous week.' },
  { key: 'scholars', title: 'Popular scholars', detail: 'Current follows among members with learning activity enabled.' },
] as const

export default function SearchIntelligencePage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const session = await getSupabase()?.auth.getSession()
        const token = session?.data.session?.access_token
        if (!token) throw new Error('Sign in with the owner account to view this report.')
        const response = await fetch('/api/search-intelligence', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        if (!controller.signal.aborted) setReport(data)
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load the report.')
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  return <main className="mx-auto max-w-5xl px-4 py-12">
    <h1 className="text-4xl font-bold text-navy">Search intelligence</h1>
    <p className="my-4 text-muted-foreground">Use member demand and gaps in the library to decide what to publish next.</p>
    {error ? <><p role="alert">{error}</p><Link className={secondaryButton} href="/login">Log in</Link></>
      : !report ? <p role="status">Loading search intelligence…</p>
      : <div className="grid gap-5 sm:grid-cols-2">
        {sections.map(({ key, title, detail }) => <section key={key} className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold text-navy">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
          {report[key].length ? <ol className="mt-4 space-y-2">
            {report[key].map(row => <li key={row.label} className="flex justify-between gap-4">
              <span>{row.label}</span><span>{row.count}{row.change !== undefined && ` (+${row.change})`}</span>
            </li>)}
          </ol> : <p className="mt-4 text-sm text-muted-foreground">No activity to show yet.</p>}
        </section>)}
      </div>}
  </main>
}
