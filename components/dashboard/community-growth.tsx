'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { communityGrowthCampaigns, communityGrowthPreferences } from '@/lib/community-growth'
import { getSupabase } from '@/lib/supabase'
import { secondaryButton } from '@/lib/site'

type Interests = { moderatorInterest: boolean; supporterInterest: boolean }

export function CommunityGrowth({ user, personalizationEnabled }: { user: User; personalizationEnabled: boolean }) {
  const [visit, setVisit] = useState<{ at: number; previous: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const recorded = useRef(false)
  const pending = useRef<Promise<void>>(Promise.resolve())
  const preferences = communityGrowthPreferences(user.user_metadata.community_growth)

  useEffect(() => {
    if (recorded.current || !personalizationEnabled) return
    recorded.current = true
    const at = Date.now()
    const previous = preferences.lastDashboardVisit
    setVisit({ at, previous })
    if (at - previous < 86_400_000) return

    pending.current = (async () => {
      const db = getSupabase()
      if (!db) return
      const { data } = await db.auth.getUser()
      if (data.user?.id !== user.id) return
      const current = communityGrowthPreferences(data.user.user_metadata.community_growth)
      if (at - current.lastDashboardVisit < 86_400_000) return
      await db.auth.updateUser({ data: { community_growth: { ...current, lastDashboardVisit: at } } })
    })().catch(() => {})
  }, [user.id, preferences.lastDashboardVisit, personalizationEnabled])

  async function save(change: Partial<Interests>) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await pending.current
      const db = getSupabase()
      const fresh = await db?.auth.getUser()
      if (!db || fresh?.data.user?.id !== user.id) throw new Error()
      const current = communityGrowthPreferences(fresh.data.user.user_metadata.community_growth)
      const result = await db.auth.updateUser({ data: { community_growth: { ...current, ...change } } })
      if (result.error) throw result.error
    } catch {
      setError('Could not save your community interests. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const campaigns = communityGrowthCampaigns({
    ...user.user_metadata,
    community_growth: { ...preferences, lastDashboardVisit: visit?.previous ?? preferences.lastDashboardVisit },
  }, visit?.at)

  return <section className="my-8 space-y-4 rounded-2xl border border-border bg-surface p-6" aria-labelledby="community-growth">
    <h2 id="community-growth" className="text-2xl font-bold text-navy">Get involved</h2>
    {campaigns.length > 0 && <ul className="grid gap-4 sm:grid-cols-2">
      {campaigns.map(campaign => <li key={campaign.id} className="space-y-2 rounded-xl border border-border p-4">
        <h3 className="font-semibold text-navy">{campaign.title}</h3>
        <p className="text-sm text-muted-foreground">{campaign.text}</p>
        <Link href={campaign.href} className={secondaryButton}>{campaign.label}</Link>
      </li>)}
    </ul>}
    <fieldset className="space-y-2" disabled={saving}>
      <legend className="mb-2 font-semibold">Community interests</legend>
      <label className="flex items-center gap-2"><input type="checkbox" checked={preferences.moderatorInterest}
        onChange={event => void save({ moderatorInterest: event.target.checked })} />I’m interested in volunteering as a moderator</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={preferences.supporterInterest}
        onChange={event => void save({ supporterInterest: event.target.checked })} />I’m interested in supporting Connect to Masjid</label>
    </fieldset>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>
}
