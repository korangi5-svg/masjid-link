import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { interestLabel, type Interest } from '@/lib/interests'
import { parseActivity } from '@/lib/recommendation-engine'
import { scholars } from '@/lib/recommendations'
import { parseTicket } from '@/lib/questions'

const ownerId = '3f126b26-2c3f-43d5-9c7f-182fcb64f1c2'
const week = 7 * 86_400_000

function increment<K>(counts: Map<K, number>, key: K) {
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

function ranked<K>(counts: Map<K, number>, label: (key: K) => string) {
  return [...counts].map(([key, count]) => ({ label: label(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export async function GET(request: Request) {
  const db = getSupabaseAdmin()
  if (!db) return NextResponse.json({ error: 'Search intelligence is unavailable.' }, { status: 503 })
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1]
  if (!token) return NextResponse.json({ error: 'Sign in with the owner account.' }, { status: 401 })
  const { data } = await db.auth.getUser(token)
  if (data.user?.id !== ownerId || !data.user.email_confirmed_at) {
    return NextResponse.json({ error: 'Owner access is required.' }, { status: 403 })
  }

  try {
    const now = Date.now()
    const topics = new Map<Interest, number>()
    const unanswered = new Map<Interest, number>()
    const follows = new Map<string, number>()
    for (let page = 1; ; page++) {
      const result = await db.auth.admin.listUsers({ page, perPage: 100 })
      if (result.error) throw result.error
      for (const user of result.data.users) {
        const activity = parseActivity(user.user_metadata.recommendation_activity, now)
        if (!activity.enabled) continue
        for (const id of activity.followedScholars) increment(follows, id)
        const recent = activity.searches.filter(search => search.at >= now - 4 * week)
        for (const topic of new Set(recent.flatMap(search => search.topics))) increment(topics, topic)
        for (const topic of new Set(recent.filter(search => search.unanswered).flatMap(search => search.topics))) {
          increment(unanswered, topic)
        }
      }
      if (result.data.users.length < 100) break
    }

    const recent = new Map<string, number>()
    const previous = new Map<string, number>()
    for (let offset = 0; ; offset += 100) {
      const result = await db.from('contact_messages').select('message,created_at')
        .in('subject', ['QA:pending', 'QA:answered', 'QA:published'])
        .gte('created_at', new Date(now - 2 * week).toISOString())
        .lte('created_at', new Date(now).toISOString())
        .order('created_at').order('id').range(offset, offset + 99)
      if (result.error) throw result.error
      for (const row of result.data) {
        const ticket = parseTicket(row.message)
        if (ticket) increment(Date.parse(row.created_at) >= now - week ? recent : previous, ticket.category)
      }
      if (result.data.length < 100) break
    }

    const trending = ranked(recent, category => category).map(row => ({
      ...row, change: row.count - (previous.get(row.label) ?? 0),
    })).filter(row => row.change > 0).sort((a, b) => b.change - a.change || b.count - a.count)

    return NextResponse.json({
      topics: ranked(topics, interestLabel),
      unanswered: ranked(unanswered, interestLabel),
      trending,
      scholars: ranked(follows, id => scholars.find(scholar => scholar.id === id)?.name ?? id),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Could not load search intelligence. Try again.' }, { status: 503 })
  }
}
