'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'
import { communityAges, communityGoals, communityLanguages, emptyMatchingPreferences, type MatchingPreferences, type CommunityGroup } from '@/lib/community-matching'

type Group = CommunityGroup & { score: number; reasons: string[] }
async function communityRequest(body?: unknown) {
  const session = await getSupabase()?.auth.getSession()
  const token = session?.data.session?.access_token
  const response = await fetch('/api/community', { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Community groups are unavailable.')
  return data
}
export function CommunityGroups() {
  const { user, loading } = useAuth()
  const [preferences, setPreferences] = useState<MatchingPreferences>(emptyMatchingPreferences)
  const [groups, setGroups] = useState<Group[]>([]), [memberships, setMemberships] = useState<string[]>([])
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState('all')
  const generation = useRef(0), locked = useRef(false)
  useEffect(() => {
    const current = ++generation.current
    let active = true
    setReady(false); setError(''); setNotice(''); setGroups([]); setMemberships([]); setPreferences(emptyMatchingPreferences)
    if (loading) return
    communityRequest().then(data => { if (active && current === generation.current) { setGroups(data.groups); setMemberships(data.memberships); setPreferences(data.preferences) } }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [user?.id, loading, refresh])
  async function save(payload: Record<string, unknown>) {
    if (locked.current) return
    locked.current = true; setBusy(true); setError(''); setNotice('')
    const current = generation.current
    try {
      await communityRequest(payload)
      const data = await communityRequest()
      if (current !== generation.current) return
      setGroups(data.groups); setMemberships(data.memberships); setPreferences(data.preferences)
      setNotice(payload.action === 'join' ? 'You joined the group.' : payload.action === 'leave' ? 'You left the group.' : payload.action === 'clear' ? 'Matching details cleared. Your group memberships are unchanged.' : 'Preferences saved. Your group recommendations are updated.')
    } catch (e) { if (current === generation.current) setError(e instanceof Error ? e.message : 'Could not save changes.') }
    finally { locked.current = false; setBusy(false) }
  }
  function toggle(key: 'languages' | 'goals', value: string) {
    setPreferences(previous => ({ ...previous, [key]: previous[key].includes(value) ? previous[key].filter(item => item !== value) : [...previous[key], value] }))
  }
  const visible = tab === 'joined' ? groups.filter(group => memberships.includes(group.id)) : groups
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <section className="rounded-3xl bg-navy p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-mint">Learn · Connect · Belong</p><h1 className="mt-3 text-4xl font-extrabold">Find your community</h1><p className="mt-4 max-w-2xl text-white/80">Discover groups with shared interests, languages, learning goals, and local connections. Choose what matters to you.</p></section>
    <div className="my-6 flex flex-wrap gap-3"><Link href="/discussions" className={secondaryButton}>Community discussions</Link><Link href="/learn" className={secondaryButton}>Learning library</Link><button className={secondaryButton} disabled={busy} onClick={() => setRefresh(value => value + 1)}>Refresh groups</button></div>
    {error && <p role="alert" className="my-5 rounded-xl border border-destructive p-4 text-destructive">{error}</p>}
    {notice && <p role="status" className="my-5 rounded-xl bg-surface p-4 text-teal-dark">{notice}</p>}
    {!ready ? <p role="status">Loading your community…</p> : <>
      {user ? <form onSubmit={event => { event.preventDefault(); void save({ action: 'preferences', preferences }) }} className="mb-9 rounded-2xl border border-border p-6">
        <h2 className="text-2xl font-bold text-navy">Your matching preferences</h2><p className="mt-2 text-sm text-muted-foreground">Every field is optional. These details are private to your account. Your saved learning interests can also help rank groups when matching is enabled.</p>
        <label className="mt-5 flex gap-3"><input type="checkbox" checked={preferences.enabled} onChange={event => setPreferences(previous => ({ ...previous, enabled: event.target.checked }))} disabled={busy} className="accent-teal"/><span>Personalize my group recommendations</span></label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="font-semibold">City and country<input value={preferences.city} maxLength={100} onChange={event => setPreferences(previous => ({ ...previous, city: event.target.value }))} placeholder="Toronto, Canada" disabled={busy} className={`${inputClass} mt-2`}/></label><label className="font-semibold">Age bracket<select value={preferences.age} onChange={event => setPreferences(previous => ({ ...previous, age: event.target.value }))} disabled={busy} className={`${inputClass} mt-2`}><option value="">Prefer not to say</option>{communityAges.map(age => <option key={age}>{age}</option>)}</select></label></div>
        <fieldset className="mt-5"><legend className="font-semibold">Languages</legend><div className="mt-3 flex flex-wrap gap-4">{communityLanguages.map(language => <label key={language} className="flex items-center gap-2"><input type="checkbox" checked={preferences.languages.includes(language)} onChange={() => toggle('languages', language)} disabled={busy} className="accent-teal"/>{language}</label>)}</div></fieldset>
        <fieldset className="mt-5"><legend className="font-semibold">Learning goals</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{communityGoals.map(goal => <label key={goal} className="flex items-center gap-2"><input type="checkbox" checked={preferences.goals.includes(goal)} onChange={() => toggle('goals', goal)} disabled={busy} className="accent-teal"/>{goal}</label>)}</div></fieldset>
        <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className={primaryButton}>{busy ? 'Saving…' : 'Save & find my groups'}</button><button type="button" disabled={busy} onClick={() => void save({ action: 'clear' })} className={secondaryButton}>Clear matching details</button></div>
      </form> : <p className="mb-7 rounded-2xl bg-surface p-6"><Link href="/login" className="text-teal-dark underline">Log in</Link> to personalize recommendations and join groups. You can browse the starter groups below.</p>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold text-navy">{tab === 'joined' ? 'My groups' : 'Discover groups'}</h2><div className="flex gap-3"><button disabled={busy} aria-pressed={tab === 'all'} className={secondaryButton} onClick={() => setTab('all')}>All groups</button>{user && <button disabled={busy} aria-pressed={tab === 'joined'} className={secondaryButton} onClick={() => setTab('joined')}>My groups ({memberships.length})</button>}</div></div>
      <p className="mb-5 text-sm text-muted-foreground">These are new Masjid Link starter circles. Joining saves the group to your account. Everyone uses the shared community discussion board.</p>
      <ul className="grid gap-5 md:grid-cols-2">{visible.map(group => <li key={group.id}><article className="flex h-full flex-col rounded-2xl border border-border p-6">
        <p className="text-sm font-semibold text-teal-dark">{group.score > 0 ? 'Recommended for you' : 'Explore a shared interest'}{memberships.includes(group.id) && ' · Joined'}</p><h3 className="mt-2 text-xl font-bold text-navy">{group.name}</h3><p className="mt-3 leading-relaxed">{group.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">{group.city || 'Online · any city'} · {group.languages.join(', ')}{group.ages.length ? ` · ${group.ages.join(', ')}` : ''}</p>
        {group.reasons.length > 0 && <ul aria-label="Why this group matches" className="mt-4 space-y-1 text-sm text-teal-dark">{group.reasons.map(reason => <li key={reason}>✓ {reason}</li>)}</ul>}
        <div className="mt-auto flex flex-wrap gap-3 pt-5"><Link href={group.resource} className={secondaryButton}>Explore resources</Link>{user && <button disabled={busy} className={memberships.includes(group.id) ? secondaryButton : primaryButton} onClick={() => void save({ action: memberships.includes(group.id) ? 'leave' : 'join', groupId: group.id })}>{memberships.includes(group.id) ? 'Leave group' : 'Join group'}</button>}</div>
      </article></li>)}</ul>
      {!visible.length && !error && <p className="rounded-2xl border border-border p-6">{tab === 'joined' ? 'You haven’t joined any groups yet.' : 'No groups are available yet.'}</p>}
    </>}
  </div>
}
