'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasCompletedOnboarding, interestLabel, parseInterests } from '@/lib/interests'
import { rankRecommendations } from '@/lib/recommendation-engine'
import { contentKinds } from '@/lib/recommendations'
import { useLearningActivity } from '@/components/learning/use-learning-activity'
import { ActivityControls } from '@/components/learning/activity-controls'
import { ContentCard, formatLabels } from '@/components/learning/content-card'
import { primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

export function PersonalizedDashboard() {
  const state = useLearningActivity()
  const { user, loading, activity } = state
  const router = useRouter()
  const completed = hasCompletedOnboarding(user?.user_metadata)
  useEffect(() => { if (!loading && user && !completed) router.replace('/onboarding') }, [loading, user, completed, router])
  if (loading || (user && !completed)) return <div className="mx-auto max-w-6xl px-4 py-16" role="status">Preparing your dashboard…</div>
  if (!user) return <div className="mx-auto max-w-2xl px-4 py-16"><h1 className="text-3xl font-bold text-navy">Your personalized dashboard</h1><p className="mt-4">Log in to discover recommendations shaped by your interests and learning.</p><Link href="/login" className={cn(primaryButton, 'mt-6')}>Log in</Link><Link href="/learn" className={cn(secondaryButton, 'ml-3 mt-6')}>Browse the library</Link></div>

  const selected = parseInterests(user.user_metadata.interests)
  const feed = rankRecommendations(selected, activity)
  const name = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name.trim().split(/\s+/)[0] : ''
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-navy p-7 text-white sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-mint">Your learning, your way</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Assalamu alaikum{name ? `, ${name}` : ''}</h1>
        <p className="mt-3 max-w-2xl text-white/80">Lectures to inspire you. Articles to reflect on. Courses to grow with. Podcasts for the journey.</p>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Your interests">{selected.map((id) => <span key={id} className="rounded-full bg-white/15 px-3 py-1.5 text-sm">{interestLabel(id)}</span>)}</div>
      </section>
      <ActivityControls state={state} />
      <div className="my-8 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold text-navy">Picked for your journey</h2><p className="mt-2 text-sm text-muted-foreground">{activity.enabled ? 'Your interests, completed learning, topic searches, and scholar follows shape this feed.' : 'Recommendations based on your selected interests. Enable activity personalization to help your feed adapt.'}</p></div><Link href="/learn" className={secondaryButton}>Search the library</Link></div>
      {contentKinds.map((kind) => {
        const items = feed.filter((item) => item.kind === kind).slice(0, 3)
        return <section key={kind} className="mb-10" aria-labelledby={`feed-${kind}`}><h3 id={`feed-${kind}`} className="mb-4 text-xl font-bold text-navy">{formatLabels[kind]}s for you</h3>{items.length ? <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <li key={item.id}><ContentCard item={item} reason={item.reason} state={state} /></li>)}</ul> : <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground">You’re all caught up with our current {formatLabels[kind].toLowerCase()}s. Browse the library to revisit completed resources.</p>}</section>
      })}
      <div className="mt-10 flex flex-wrap gap-3"><Link href="/learn" className={primaryButton}>Explore all content</Link><Link href="/account" className={secondaryButton}>Manage my profile</Link></div>
    </div>
  )
}
