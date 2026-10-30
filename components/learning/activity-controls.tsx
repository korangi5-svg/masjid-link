'use client'

import Link from 'next/link'
import { useState } from 'react'
import { scholars } from '@/lib/recommendations'
import { primaryButton, secondaryButton, focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { LearningState } from './use-learning-activity'

export function ActivityControls({ state }: { state: LearningState }) {
  const { user, loading, activity, saving, error, save } = state
  const [clearing, setClearing] = useState(false)
  const [notice, setNotice] = useState('')
  return (
    <section className="my-8 rounded-2xl border border-border bg-surface p-6" aria-label="Recommendation settings">
      <h2 className="text-xl font-bold text-navy">Make your recommendations better</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Use your completed reading, watched lectures, followed scholars, and searched topics to shape your feed. Source links open on the publisher’s website; use the completion buttons here to tell us what you finished.</p>
      {!user ? <p className="mt-4 text-sm">{loading ? 'Loading your settings…' : <><Link href="/login" className="font-semibold text-teal-dark underline">Log in</Link> to save activity. You can browse the library without tracking.</>}</p> : <>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" aria-pressed={activity.enabled} disabled={saving} className={activity.enabled ? secondaryButton : primaryButton} onClick={async () => { if (await save({ type: 'enable', enabled: !activity.enabled })) setNotice(activity.enabled ? 'Activity personalization paused. Your interests still shape your feed.' : 'Activity personalization enabled.') }}>{saving ? 'Saving…' : activity.enabled ? 'Pause activity personalization' : 'Enable activity personalization'}</button>
          <Link href="/onboarding" className={secondaryButton}>Edit interests</Link>
          <button type="button" disabled={saving} onClick={() => setClearing(true)} className={cn('rounded text-sm font-semibold text-navy underline', focusRing)}>Clear activity & follows</button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{activity.enabled ? 'On' : 'Off'} · Saved to your account. Up to 32 completed items and 12 topic searches from the last 180 days influence your feed. Search text is not saved. Pausing stops new collection and uses only your selected interests.</p>
        {clearing && <div className="mt-4 rounded-xl border border-border bg-white p-4"><p className="text-sm">Clear your completed items, searched topics, and followed scholars? Your selected interests stay saved.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" className={secondaryButton} disabled={saving} onClick={async () => { if (await save({ type: 'clear' })) { setClearing(false); setNotice('Your learning activity and follows have been cleared.') } }}>Clear now</button><button type="button" className={secondaryButton} onClick={() => setClearing(false)}>Cancel</button></div></div>}
        <div className="mt-6 border-t border-border pt-5"><h3 className="font-bold text-navy">Scholars to follow</h3><p className="mt-1 text-sm text-muted-foreground">Following boosts their content in your recommendations. Enable personalization to save follows.</p><ul className="mt-4 grid gap-3 sm:grid-cols-2">{scholars.map((scholar) => {
          const followed = activity.followedScholars.includes(scholar.id)
          return <li key={scholar.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"><div><p className="font-semibold text-navy">{scholar.name}</p><p className="mt-1 text-xs text-muted-foreground">{scholar.description}</p></div><button type="button" aria-pressed={followed} aria-label={`${followed ? 'Unfollow' : 'Follow'} ${scholar.name}`} disabled={!activity.enabled || saving} className={secondaryButton} onClick={async () => { if (await save({ type: 'follow', scholarId: scholar.id, following: !followed })) setNotice(`${followed ? 'Unfollowed' : 'Following'} ${scholar.name}.`) }}>{followed ? 'Following ✓' : 'Follow'}</button></li>
        })}</ul></div>
      </>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-teal-dark">{notice}</p>}
    </section>
  )
}
