'use client'

import Link from 'next/link'
import { useState } from 'react'
import { scholars, contentCatalog } from '@/lib/recommendations'
import { similarScholars } from '@/lib/scholar-follow'
import { interestLabel } from '@/lib/interests'
import { primaryButton, secondaryButton } from '@/lib/site'
import { useLearningActivity } from './use-learning-activity'

export function ScholarHub() {
  const state = useLearningActivity()
  const [notice, setNotice] = useState('')
  const similar = similarScholars(state.activity)
  async function toggle(id: string) {
    const following = state.activity.followedScholars.includes(id)
    if (await state.save({ type: 'follow', scholarId: id, following: !following })) setNotice(following ? 'Scholar unfollowed. Future updates and digests will exclude their content.' : 'Scholar followed. New content published to Masjid Link will appear in your notifications.')
  }
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <p className="text-sm font-semibold uppercase tracking-wider text-teal-dark">Pray · Learn · Connect</p>
    <h1 className="mt-3 text-4xl font-extrabold text-navy">Learn from the voices you follow</h1>
    <p className="mt-3 max-w-3xl text-muted-foreground">Follow scholars to keep their learning close. Receive updates when their content is published to Masjid Link and choose a weekly email digest.</p>
    <div className="my-6 flex flex-wrap gap-3"><Link href="/notifications" className={primaryButton}>My updates & weekly digest</Link><Link href="/learn" className={secondaryButton}>Browse the library</Link></div>
    {state.loading ? <p role="status">Loading your follows…</p> : !state.user ? <p className="my-6"><Link href="/login" className="font-semibold text-teal-dark underline">Log in</Link> to follow scholars and save your preferences across devices.</p> : !state.activity.enabled ? <div className="my-6 rounded-xl bg-surface p-5"><p className="mb-3">Enable activity personalization to save scholar follows, as well as your optional learning activity.</p><button className={primaryButton} disabled={state.saving} onClick={() => state.save({ type: 'enable', enabled: true })}>Enable personalization</button></div> : null}
    {state.error && <p role="alert" className="my-4 text-destructive">{state.error}</p>}{notice && <p role="status" className="my-4 text-teal-dark">{notice}</p>}
    <ul className="mt-8 grid gap-6 md:grid-cols-2">{scholars.map(s => {
      const following = state.activity.followedScholars.includes(s.id)
      const items = contentCatalog.filter(item => item.scholarIds.includes(s.id))
      return <li key={s.id} className="rounded-2xl border border-border bg-white p-6"><h2 className="text-2xl font-bold text-navy">{s.name}</h2><p className="mt-2 text-muted-foreground">{s.description}</p><div className="my-4 flex flex-wrap gap-2">{[...new Set(items.flatMap(item => item.interests))].map(topic => <span key={topic} className="rounded-full bg-surface px-3 py-1 text-xs text-teal-dark">{interestLabel(topic)}</span>)}</div><button aria-pressed={following} disabled={!state.user || !state.activity.enabled || state.saving} onClick={() => toggle(s.id)} className={following ? secondaryButton : primaryButton}>{following ? 'Following ✓' : 'Follow scholar'}</button><h3 className="mt-6 font-bold text-navy">In the library</h3><ul className="mt-2 space-y-2 text-sm">{items.map(item => <li key={item.id}><a href={item.href} target="_blank" rel="noopener noreferrer" className="text-teal-dark underline">{item.title} ↗</a></li>)}</ul></li>
    })}</ul>
    <section className="mt-10 rounded-2xl bg-surface p-6"><h2 className="text-2xl font-bold text-navy">Similar scholars</h2>{similar.length ? <ul className="mt-4 space-y-4">{similar.map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5"><div><h3 className="font-bold text-navy">{s.name}</h3><p className="mt-1 text-sm text-muted-foreground">Similar to your follows through {s.sharedTopics.map(interestLabel).join(', ')}.</p></div><button className={secondaryButton} disabled={!state.user || !state.activity.enabled || state.saving} onClick={() => toggle(s.id)}>Follow scholar</button></li>)}</ul> : <p className="mt-3 text-muted-foreground">{state.activity.followedScholars.length ? 'You’re following all matching scholars in our current library. More suggestions will appear as the library grows.' : 'Follow a scholar to see others with shared topics.'}</p>}</section>
    <p className="mt-6 text-sm text-muted-foreground">Updates cover content published to this platform. We do not monitor every upload on external publishers’ websites.</p>
  </div>
}
