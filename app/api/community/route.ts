import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emptyMatchingPreferences, matchingPreferences, recommendGroups, type CommunityGroup } from '@/lib/community-matching'

export const dynamic = 'force-dynamic'
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const json = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
async function identify(request: Request, db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return null
  const result = await db.auth.getUser(token)
  return result.error ? null : result.data.user
}
async function directory(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const result = await db.from('community_groups').select('id,details').eq('active', true).order('id').limit(200)
  if (result.error) throw new Error('Directory unavailable')
  return (result.data || []).map(row => ({ ...row.details, id: row.id })) as CommunityGroup[]
}
export async function GET(request: Request) {
  try {
    const db = getSupabaseAdmin()
    if (!db) return fail('Community groups are temporarily unavailable.', 503)
    const user = await identify(request, db)
    if (request.headers.has('authorization') && !user) return fail('Please log in again.', 401)
    const groups = await directory(db)
    let preferences = emptyMatchingPreferences, memberships: string[] = []
    if (user) {
      const [prefs, joined] = await Promise.all([
        db.from('community_matching_preferences').select('preferences').eq('user_id', user.id).maybeSingle(),
        db.from('community_group_memberships').select('group_id').eq('user_id', user.id),
      ])
      if (prefs.error || joined.error) return fail('Could not load your community preferences.', 503)
      if (prefs.data) preferences = matchingPreferences(prefs.data.preferences)
      memberships = (joined.data || []).map(row => row.group_id)
    }
    const recommendations = recommendGroups(groups, preferences, user?.user_metadata?.interests)
    const joinedOnly = groups.filter(group => memberships.includes(group.id) && !recommendations.some(item => item.id === group.id)).map(group => ({ ...group, score: 0, reasons: [] }))
    return json({ preferences, groups: [...recommendations, ...joinedOnly], memberships })
  } catch { return fail('Community groups are temporarily unavailable. Please retry.', 503) }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) return fail('Please submit from this website.', 403)
    const raw = await request.text()
    if (raw.length > 4000) return fail('Submission is too large.', 413)
    let input: Record<string, unknown>
    try { input = JSON.parse(raw); if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error() } catch { return fail('Invalid community request.', 400) }
    const db = getSupabaseAdmin()
    if (!db) return fail('Community groups are temporarily unavailable.', 503)
    const user = await identify(request, db)
    if (!user?.email_confirmed_at) return fail('Log in with a verified account to save preferences or join a group.', 401)
    if (input.action === 'preferences') {
      let preferences
      try { preferences = matchingPreferences(input.preferences) } catch (error) { return fail(error instanceof Error ? error.message : 'Invalid preferences.', 400) }
      const saved = await db.from('community_matching_preferences').upsert({ user_id: user.id, preferences, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (saved.error) return fail('Could not save your preferences.', 503)
      return json({ saved: true })
    }
    if (input.action === 'clear') {
      const saved = await db.from('community_matching_preferences').delete().eq('user_id', user.id)
      if (saved.error) return fail('Could not clear your preferences.', 503)
      return json({ cleared: true })
    }
    if (!['join', 'leave'].includes(String(input.action)) || typeof input.groupId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(input.groupId)) return fail('Choose a valid group action.', 400)
    if (input.action === 'join') {
      const group = await db.from('community_groups').select('id').eq('id', input.groupId).eq('active', true).maybeSingle()
      if (group.error) return fail('Could not check this group.', 503)
      if (!group.data) return fail('This group is unavailable.', 404)
      const saved = await db.from('community_group_memberships').upsert({ user_id: user.id, group_id: input.groupId }, { onConflict: 'user_id,group_id' })
      if (saved.error) return fail('Could not join this group.', 503)
    } else {
      const saved = await db.from('community_group_memberships').delete().eq('user_id', user.id).eq('group_id', input.groupId)
      if (saved.error) return fail('Could not leave this group.', 503)
    }
    return json({ saved: true })
  } catch { return fail('Could not update your community settings. Please retry.', 503) }
}
