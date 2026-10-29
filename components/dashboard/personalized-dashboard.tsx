'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { hasCompletedOnboarding, interestLabel, parseInterests } from '@/lib/interests'
import { recommendResources } from '@/lib/recommendations'
import { focusRing, primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

export function PersonalizedDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const completed = hasCompletedOnboarding(user?.user_metadata)
  useEffect(() => { if (!loading && user && !completed) router.replace('/onboarding') }, [loading, user, completed, router])
  if (loading || (user && !completed)) return <div className="mx-auto max-w-6xl px-4 py-16" role="status">Preparing your dashboard…</div>
  if (!user) return <div className="mx-auto max-w-2xl px-4 py-16"><h1 className="text-3xl font-bold text-navy">Your personalized dashboard</h1><p className="mt-4">Log in to see recommendations based on your interests.</p><Link href="/login" className={cn(primaryButton, 'mt-6')}>Log in</Link><Link href="/signup" className={cn(secondaryButton, 'ml-3 mt-6')}>Create account</Link></div>

  const selected = parseInterests(user.user_metadata.interests)
  const feed = recommendResources(selected)
  const name = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name.trim().split(/\s+/)[0] : ''
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-navy p-7 text-white sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-mint">Your learning, your way</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Assalamu alaikum{name ? `, ${name}` : ''}</h1>
        <p className="mt-3 max-w-xl text-white/80">A space to learn, reflect, and grow — shaped around the topics you care about.</p>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Your interests">{selected.map((id) => <span key={id} className="rounded-full bg-white/15 px-3 py-1.5 text-sm">{interestLabel(id)}</span>)}</div>
      </section>
      <div className="my-8 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-navy">Recommended for you</h2><p className="mt-2 text-sm text-muted-foreground">Selected automatically from our curated learning resources using your saved interests.</p></div>
        <Link href="/onboarding" className={secondaryButton}>Edit interests</Link>
      </div>
      {feed.length ? <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{feed.map((resource) => (
        <li key={resource.id}><article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">{resource.format} · {resource.publisher}</p>
          <h3 className="mt-4 text-xl font-bold text-navy">{resource.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
          <p className="mt-5 text-xs text-teal-dark">Because you chose {resource.matchedInterests.map(interestLabel).join(' and ')}</p>
          <a href={resource.href} target="_blank" rel="noopener noreferrer" className={cn('mt-auto rounded pt-5 text-sm font-bold text-navy hover:text-teal', focusRing)}>Explore resource <span aria-hidden="true">↗</span><span className="sr-only">: {resource.title} (opens in a new tab)</span></a>
        </article></li>
      ))}</ul> : <p role="status">More resources for your interests are on the way. Explore the library below.</p>}
      <div className="mt-10 flex flex-wrap gap-3"><Link href="/resources" className={secondaryButton}>Browse all resources</Link><Link href="/account" className={secondaryButton}>Manage my profile</Link></div>
    </div>
  )
}
