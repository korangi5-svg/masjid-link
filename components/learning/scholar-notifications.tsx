'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { parseFollowPreferences, scholarUpdates, weeklyDigest, type FollowAction, type FollowPreferences } from '@/lib/scholar-follow'
import { saveFollowPreferences } from '@/lib/services/recommendation-activity'
import { scholars } from '@/lib/recommendations'
import { primaryButton, secondaryButton } from '@/lib/site'
import { useLearningActivity } from './use-learning-activity'

export function ScholarNotifications({ emailReady }: { emailReady: boolean }) {
  const state = useLearningActivity()
  const activeUser = useRef(state.user?.id)
  activeUser.current = state.user?.id
  const [saved, setSaved] = useState<{ userId: string; prefs: FollowPreferences } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const prefs = saved?.userId === state.user?.id ? saved!.prefs : parseFollowPreferences(state.user?.user_metadata?.scholar_notifications)
  const updates = scholarUpdates(state.activity, prefs)
  const unread = updates.filter(item => !prefs.read.includes(item.id))
  const digest = weeklyDigest(state.activity, prefs)
  async function save(action: FollowAction) {
    if (!state.user || busy) return
    const id = state.user.id
    setBusy(true); setError(''); setNotice('')
    try {
      const next = await saveFollowPreferences(id, action)
      if (activeUser.current === id) { setSaved({ userId: id, prefs: next }); setNotice(action.type === 'read-notifications' ? 'Updates marked as read.' : 'Notification preferences saved to your account.') }
    } catch (e) { if (activeUser.current === id) setError(e instanceof Error ? e.message : 'Could not save preferences.') }
    finally { if (activeUser.current === id) setBusy(false) }
  }
  if (state.loading) return <p className="mx-auto max-w-6xl px-4 py-12" role="status">Loading notifications…</p>
  if (!state.user) return <div className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold text-navy">Your scholar updates</h1><p className="my-5">Log in to see new content from scholars you follow and manage your digest.</p><Link href="/login" className={primaryButton}>Log in</Link></div>
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-4xl font-extrabold text-navy">Your scholar updates</h1><p className="mt-3 text-muted-foreground">New content from your circle, and a weekly moment to catch up.</p><div className="my-6 flex flex-wrap gap-3"><Link href="/scholars" className={secondaryButton}>Manage followed scholars</Link><Link href="/dashboard" className={secondaryButton}>My dashboard</Link></div>
    <section className="my-8 rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-bold text-navy">How you stay connected</h2><label className="mt-5 flex items-center gap-3"><input type="checkbox" checked={prefs.inApp} disabled={busy} onChange={e => save({ type: 'notifications', inApp: e.target.checked, weeklyEmail: prefs.weeklyEmail })} className="size-4 accent-teal"/>Show new-content notifications in the app</label><label className="mt-4 flex items-center gap-3"><input type="checkbox" checked={prefs.weeklyEmail} disabled={busy || (!emailReady && !prefs.weeklyEmail)} onChange={e => save({ type: 'notifications', inApp: prefs.inApp, weeklyEmail: e.target.checked })} className="size-4 accent-teal"/>Email me a weekly digest from scholars I follow</label><p className="mt-3 text-sm text-muted-foreground">Weekly on Friday at 13:00 UTC (9 a.m. Toronto daylight time; 8 a.m. standard time). No email is sent when there is no new content. You can turn it off here at any time.</p>{!emailReady && <p role="status" className="mt-3 text-sm text-muted-foreground">Weekly email delivery is awaiting a verified sending address and server configuration. In-app notifications and digest previews remain available.</p>}{!state.user.email_confirmed_at && <p className="mt-3 text-sm text-muted-foreground">Verify your account email before receiving a digest.</p>}{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}{notice && <p role="status" className="mt-4 text-teal-dark">{notice}</p>}</section>
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold text-navy">New content {prefs.inApp && unread.length ? `(${unread.length} unread)` : ''}</h2>{prefs.inApp && unread.length > 0 && <button className={secondaryButton} disabled={busy} onClick={() => save({ type: 'read-notifications', ids: unread.map(item => item.id) })}>Mark all as read</button>}</div>
    {!prefs.inApp ? <p className="my-6 rounded-xl border border-border p-6">In-app notifications are paused. Enable them above to see your updates.</p> : updates.length ? <ul className="mt-5 space-y-4">{updates.map(item => <li key={item.id} className={`rounded-xl border p-5 ${prefs.read.includes(item.id) ? 'border-border' : 'border-teal bg-surface'}`}><p className="text-xs font-semibold uppercase text-teal-dark">{prefs.read.includes(item.id) ? 'Read' : 'New'} · {item.kind}</p><h3 className="mt-2 text-xl font-bold text-navy"><a href={item.href} target="_blank" rel="noopener noreferrer" className="underline" onClick={() => { if (!prefs.read.includes(item.id)) save({ type: 'read-notifications', ids: [item.id] }) }}>{item.title} ↗</a></h3><p className="mt-2 text-sm text-muted-foreground">{scholars.filter(s => item.scholarIds.includes(s.id)).map(s => s.name).join(', ')} · {new Date(item.publishedAt!).toLocaleDateString()}</p></li>)}</ul> : <div className="my-6 rounded-xl border border-border p-6"><h3 className="font-bold text-navy">You’re all caught up</h3><p className="mt-2 text-muted-foreground">{state.activity.followedScholars.length ? 'New content published to Masjid Link after you follow a scholar will appear here. Existing undated library resources are not treated as new uploads.' : 'Follow a scholar to start receiving new-content updates.'}</p></div>}
    <section className="mt-10 rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">Your weekly digest preview</h2><p className="mt-2 text-sm text-muted-foreground">New content from your followed scholars over the last seven days.</p>{digest.length ? <ul className="mt-4 space-y-3">{digest.map(item => <li key={item.id}><a href={item.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-dark underline">{item.title} ↗</a><p className="text-sm text-muted-foreground">{item.publisher} · {item.kind}</p></li>)}</ul> : <p className="mt-4 text-muted-foreground">No new content for this week’s digest yet.</p>}</section>
  </div>
}
