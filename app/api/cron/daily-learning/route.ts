import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dailyEmailText, dailyLesson, dailyPreferences, learningDate } from '@/lib/daily-learning'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin(), key = process.env.RESEND_API_KEY, from = process.env.DAILY_FROM_EMAIL || process.env.SCHOLAR_FROM_EMAIL
  if (!db || !key || !from) return NextResponse.json({ error: 'Daily email requires Supabase admin access, RESEND_API_KEY and a verified DAILY_FROM_EMAIL or SCHOLAR_FROM_EMAIL.' }, { status: 503 })
  const started = Date.now(), date = learningDate(started)
  let sent = 0, skipped = 0, failed = 0
  try {
    for (let page = 1; ; page++) {
      const result = await db.auth.admin.listUsers({ page, perPage: 100 })
      if (result.error) throw new Error('Could not read subscribers')
      for (const candidate of result.data.users) {
        if (Date.now() - started > 250000) throw new Error('Processing window exceeded')
        if (!dailyPreferences(candidate.user_metadata?.daily_learning).email || candidate.app_metadata?.daily_learning_date === date) { skipped++; continue }
        const fresh = await db.auth.admin.getUserById(candidate.id)
        if (fresh.error) { failed++; continue }
        const user = fresh.data.user
        if (!user.email || !user.email_confirmed_at || !dailyPreferences(user.user_metadata?.daily_learning).email || user.app_metadata?.daily_learning_date === date) { skipped++; continue }
        try {
          const lesson = dailyLesson(user.user_metadata?.interests, started)
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `daily-learning/${user.id}/${date}` },
            body: JSON.stringify({ from, to: [user.email], subject: `Daily Islamic Learning — ${date} · ${lesson.title}`, text: dailyEmailText(lesson) }), signal: AbortSignal.timeout(10000),
          })
          const body = await response.json()
          if (!response.ok || !body.id) { failed++; continue }
          const saved = await db.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, daily_learning_date: date } })
          if (saved.error) { failed++; continue }
          sent++
        } catch { failed++ }
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      if (result.data.users.length < 100) break
    }
    return NextResponse.json({ date, sent, skipped, failed }, { status: failed ? 502 : 200 })
  } catch { return NextResponse.json({ error: 'Daily email run incomplete. Retry to continue unsent lessons.', date, sent, skipped, failed }, { status: 503 }) }
}
