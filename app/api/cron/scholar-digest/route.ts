import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { digestText, digestWeek, parseFollowPreferences, weeklyDigest } from '@/lib/scholar-follow'

import { loadWeeklyCommunity, weeklyEngagementText } from '@/lib/weekly-engagement'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const key = process.env.RESEND_API_KEY
  const from = process.env.SCHOLAR_FROM_EMAIL
  if (!db || !key || !from) return NextResponse.json({ error: 'Configure Supabase admin access, RESEND_API_KEY, and a verified SCHOLAR_FROM_EMAIL sender.' }, { status: 503 })
  const now = Date.now(), week = digestWeek(now), started = now
  let community: ReturnType<typeof loadWeeklyCommunity> | undefined
  let sent = 0, skipped = 0, failed = 0
  try {
    for (let page = 1; ; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 })
      if (error) throw new Error('Could not load subscribers')
      for (const candidate of data.users) {
        if (Date.now() - started > 250000) throw new Error('Digest run exceeded its processing window; retry to continue unsent subscribers.')
        const candidatePrefs = parseFollowPreferences(candidate.user_metadata?.scholar_notifications)
        if ((!candidatePrefs.weeklyEmail && !candidatePrefs.engagementEmail) || candidate.app_metadata?.scholar_digest_week === week) { skipped++; continue }
        // Re-read before sending so an unsubscribe/account change takes effect during long runs.
        const fresh = await db.auth.admin.getUserById(candidate.id)
        if (fresh.error) { failed++; continue }
        const user = fresh.data.user
        const prefs = parseFollowPreferences(user.user_metadata?.scholar_notifications)
        if (!user.email || !user.email_confirmed_at || (!prefs.engagementEmail && (!prefs.weeklyEmail || !prefs.emailSince)) || user.app_metadata?.scholar_digest_week === week) { skipped++; continue }
        const items = prefs.weeklyEmail && prefs.emailSince
          ? weeklyDigest(user.user_metadata?.recommendation_activity, prefs, now)
          : []
        try {
          const engagement = prefs.engagementEmail
            ? weeklyEngagementText(user.user_metadata, await (community ??= loadWeeklyCommunity(db, now)), now)
            : ''
          if (!items.length && !engagement) { skipped++; continue }
          const text = [
            items.length ? digestText(items) : '',
            engagement ? engagement + '\n\nManage weekly email preferences: https://masjid-link.vercel.app/notifications' : '',
          ].filter(Boolean).join('\n\n')
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `scholar-digest/${user.id}/${week}` },
            body: JSON.stringify({ from, to: [user.email], subject: engagement ? 'This week on Connect to Masjid' : 'Your weekly scholar digest · Masjid Link', text }), signal: AbortSignal.timeout(10000),
          })
          const body = await response.json()
          if (!response.ok || !body.id) { failed++; continue }
          const saved = await db.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, scholar_digest_week: week } })
          if (saved.error) { failed++; continue }
          sent++
        } catch { failed++ }
        // Keep within the provider's default request-rate limit.
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      if (data.users.length < 100) break
    }
    return NextResponse.json({ sent, skipped, failed }, { status: failed ? 502 : 200 })
  } catch {
    return NextResponse.json({ error: 'Digest run incomplete. Check service configuration and retry.', sent, skipped, failed }, { status: 503 })
  }
}
