'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

type Post = { id: string; parent_id: string | null; body: string; created_at: string; status?: string; revision?: number; appealed?: boolean; review_note?: string; context?: { body: string; status: string } | null; moderation?: { flags: string[]; reason: string; source: string } }
async function api(query: string, body?: unknown) {
  const session = await getSupabase()?.auth.getSession()
  const token = session?.data.session?.access_token
  const response = await fetch(`/api/discussions${query}`, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Discussions are unavailable.')
  return result
}

export function Discussions({ review = false }: { review?: boolean }) {
  const { user, loading } = useAuth()
  const [view, setView] = useState(review ? 'review' : 'public')
  const [filter, setFilter] = useState('queue')
  const [posts, setPosts] = useState<Post[]>([]), [thread, setThread] = useState<Post | null>(null)
  const [moderator, setModerator] = useState(false), [body, setBody] = useState('')
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const generation = useRef(0), lock = useRef(false)
  useEffect(() => {
    const current = ++generation.current
    let active = true
    setPosts([]); setReady(false); setError(''); setModerator(false); setNotes({}); setNotice(''); setBody('')
    if (loading) return
    if (view === 'mine' && !user) { setReady(true); return }
    const query = view === 'public' && thread ? `?thread=${thread.id}` : `?view=${view}${view === 'review' ? `&status=${filter}` : ''}`
    api(query).then(result => { if (active && generation.current === current) { setPosts(result.posts || []); setModerator(result.moderator === true) } })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [view, filter, thread?.id, user?.id, loading, refresh])

  async function mutate(payload: Record<string, unknown>) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    const current = generation.current
    try {
      const result = await api('', payload)
      if (generation.current !== current) return
      if (payload.action === 'post') {
        setBody('')
        const status = result.post?.status || result.status
        setNotice(status === 'approved' ? 'Your post passed the checks and is published.' : 'Your post was saved privately for moderator review. See My posts for its status.')
        if (status === 'approved' && view === 'public') setPosts(previous => thread ? [...previous, result.post] : [result.post, ...previous])
      } else if (payload.action === 'appeal') {
        setPosts(previous => previous.map(post => post.id === result.post.id ? result.post : post))
        setNotice('Appeal sent for human review. Your post remains hidden until approved.')
      } else {
        setPosts(previous => previous.filter(post => post.id !== payload.id))
        setNotice('Moderator decision saved.')
      }
    } catch (e) { if (generation.current === current) setError(e instanceof Error ? e.message : 'Could not save your changes.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
    <section className="rounded-3xl bg-navy p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-mint">Masjid Link Community</p><h1 className="mt-3 text-4xl font-extrabold">{review ? 'Discussion moderation' : 'Community discussions'}</h1><p className="mt-4 max-w-2xl text-white/80">{review ? 'Review flagged posts and appeals, or revisit automatic approvals. Your reason is visible to the member.' : 'Share ideas, ask questions, and learn together. Keep conversations respectful and leave personal details out.'}</p></section>
    <div className="my-6 flex flex-wrap gap-3">
      {review ? <Link href="/discussions" className={secondaryButton}>Back to discussions</Link> : <><button className={secondaryButton} disabled={busy} onClick={() => { setView('public'); setThread(null) }}>Discussions</button>{user && <button className={secondaryButton} disabled={busy} onClick={() => { setView('mine'); setThread(null) }}>My posts</button>}</>}
      {moderator && !review && <Link href="/discussions/review" className={secondaryButton}>Moderation queue</Link>}
      <Link href="/questions" className={secondaryButton}>Questions & answers</Link>
      <Link href="/community" className={secondaryButton}>Find community groups</Link>
      <button className={secondaryButton} disabled={busy} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
    </div>
    {review && <label className="mb-6 block font-semibold">Show<select value={filter} onChange={e => setFilter(e.target.value)} disabled={busy} className={`${inputClass} mt-2`}><option value="queue">Pending, flagged, and appealed posts</option><option value="approved">Approved posts — review or remove</option><option value="rejected">Rejected posts — reconsider</option></select></label>}
    {error && <p role="alert" className="my-5 rounded-xl border border-destructive p-4 text-destructive">{error}</p>}
    {notice && <p role="status" className="my-5 rounded-xl bg-surface p-4 text-teal-dark">{notice}</p>}
    {!review && view === 'public' && <>
      {thread && <article className="mb-6 rounded-2xl border border-teal bg-surface p-6"><h2 className="font-bold text-navy">Discussion</h2><p className="mt-3 whitespace-pre-wrap break-words">{thread.body}</p></article>}
      {user ? <form onSubmit={e => { e.preventDefault(); void mutate({ action: 'post', body, parentId: thread?.id || null }) }} className="mb-8 rounded-2xl border border-border p-6">
        <label htmlFor="discussion-body" className="block text-xl font-bold text-navy">{thread ? 'Write a reply' : 'Start a discussion'}</label><textarea id="discussion-body" required minLength={10} maxLength={2000} rows={4} value={body} onChange={e => setBody(e.target.value)} disabled={busy || !ready || Boolean(error)} className={`${inputClass} mt-4`} />
        <p className="mt-3 text-sm text-muted-foreground">Posts are checked for spam, abuse, hostile exchanges, and inappropriate content using OpenAI. Clear passes publish automatically; uncertain or flagged posts await human review. Respectful disagreement is welcome. Text and reply context are sent for these checks.</p>
        <button disabled={busy || !ready || Boolean(error) || body.trim().length < 10} className={`${primaryButton} mt-5`}>{busy ? 'Saving and checking…' : thread ? 'Submit reply' : 'Submit post'}</button>
      </form> : <p className="mb-6"><Link href="/login" className="text-teal-dark underline">Log in</Link> with a verified account to post. You can read approved discussions below.</p>}
    </>}
    <h2 className="mb-4 text-2xl font-bold text-navy">{review ? 'Posts for review' : view === 'mine' ? 'My posts' : thread ? 'Replies' : 'Latest discussions'}</h2>
    {!ready ? <p role="status">Loading discussions…</p> : <>
      {!error && !posts.length && <p className="rounded-2xl border border-border p-6">{review ? 'No posts in this view.' : 'No posts to show yet.'}</p>}
      <ul className="space-y-5">{posts.map(post => <li key={post.id}><article className="rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground">Community member · {new Date(post.created_at).toLocaleString()}{post.status && ` · ${post.status}`}{post.appealed && ' · Appeal requested'}{post.parent_id && ' · Reply'}</p>
        <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{post.body}</p>
        {post.moderation && <p className="mt-3 text-sm text-muted-foreground">{post.moderation.reason}{post.moderation.flags.length ? ` · Flags: ${post.moderation.flags.join(', ')}` : ''}</p>}
        {post.review_note && <p className="mt-3 text-sm"><strong>Moderator:</strong> {post.review_note}</p>}
        {review && post.context && <blockquote className="mt-4 rounded-xl bg-surface p-4"><p className="text-sm font-semibold">Replying to a {post.context.status} discussion</p><p className="mt-2 whitespace-pre-wrap break-words">{post.context.body}</p></blockquote>}
        {!review && view === 'public' && !thread && <button className={`${secondaryButton} mt-4`} disabled={busy} onClick={() => setThread(post)}>Read replies / reply</button>}
        {view === 'mine' && !post.appealed && ['held', 'rejected'].includes(post.status || '') && <button disabled={busy} className={`${secondaryButton} mt-4`} onClick={() => void mutate({ action: 'appeal', id: post.id, revision: post.revision })}>Request human review</button>}
        {review && <form onSubmit={e => { e.preventDefault(); const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; if (!submitter) { setError('Choose Approve or Reject to save your decision.'); return } void mutate({ action: 'review', id: post.id, revision: post.revision, status: submitter.value, note: notes[post.id] || '' }) }} className="mt-5 border-t border-border pt-5">
          <label htmlFor={`note-${post.id}`} className="mt-3 block font-semibold">Reason for the member</label><input id={`note-${post.id}`} required minLength={3} maxLength={300} value={notes[post.id] || ''} onChange={e => setNotes(previous => ({ ...previous, [post.id]: e.target.value }))} disabled={busy} className={`${inputClass} mt-2`} />
          <div className="mt-4 flex flex-wrap gap-3"><button type="submit" value="approved" disabled={busy || post.status === 'approved'} className={primaryButton}>Approve</button><button type="submit" value="rejected" disabled={busy || post.status === 'rejected'} className={secondaryButton}>Reject / remove</button></div>
        </form>}
      </article></li>)}</ul>
      {!error && <p className="mt-6 text-sm text-muted-foreground">Showing up to 100 posts per view. {review ? 'Pending posts stay private until approved.' : 'Refresh to see new posts and review decisions.'}</p>}
    </>}
  </div>
}
