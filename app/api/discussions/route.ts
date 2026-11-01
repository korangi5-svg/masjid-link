import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isDiscussionModerator, moderateDiscussion } from '@/lib/discussion-moderation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const json = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
const columns = 'id,parent_id,body,status,moderation,appealed,review_note,revision,created_at'
async function identify(request: Request, db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return null
  const result = await db.auth.getUser(token)
  return result.error ? null : result.data.user
}

export async function GET(request: Request) {
  try {
    const db = getSupabaseAdmin()
    if (!db) return fail('Discussions are not configured yet.', 503)
    const user = await identify(request, db)
    if (request.headers.has('authorization') && !user) return fail('Please log in again.', 401)
    const moderator = Boolean(user && isDiscussionModerator(user))
    const params = new URL(request.url).searchParams
    const mode = params.get('view') || 'public'
    if (!['public', 'mine', 'review'].includes(mode)) return fail('Unknown discussion view.', 400)
    if (mode === 'review' && !moderator) return fail('Moderator access is required.', 403)
    if (mode === 'mine' && !user) return fail('Please log in to see your posts.', 401)
    if (mode !== 'public') {
      let query = db.from('discussion_posts').select(columns)
      const filter = params.get('status') || 'queue'
      if (mode === 'review' && !['queue', 'approved', 'rejected'].includes(filter)) return fail('Invalid review filter.', 400)
      query = mode === 'mine' ? query.eq('author_id', user!.id) : filter === 'queue' ? query.in('status', ['pending', 'held']) : query.eq('status', filter)
      const result = await query.order('created_at', { ascending: mode === 'review' && filter === 'queue' }).limit(100)
      if (result.error) return fail('Could not load discussions. Check the database setup.', 503)
      if (mode === 'review') {
        const ids = [...new Set((result.data || []).map(row => row.parent_id).filter(Boolean))]
        if (ids.length) {
          const parents = await db.from('discussion_posts').select('id,body,status').in('id', ids)
          if (parents.error) return fail('Could not load discussion context.', 503)
          return json({ posts: (result.data || []).map(row => ({ ...row, context: parents.data?.find(parent => parent.id === row.parent_id) || null })), moderator })
        }
      }
      return json({ posts: result.data, moderator })
    }
    const parent = params.get('thread')
    if (parent) {
      if (!uuid(parent)) return fail('Invalid discussion.', 400)
      const root = await db.from('discussion_posts').select('id').eq('id', parent).eq('status', 'approved').is('parent_id', null).maybeSingle()
      if (root.error) return fail('Could not load discussion.', 503)
      if (!root.data) return fail('Discussion is unavailable.', 404)
    }
    let query = db.from('discussion_posts').select('id,parent_id,body,created_at').eq('status', 'approved')
    query = parent ? query.eq('parent_id', parent) : query.is('parent_id', null)
    const result = await query.order('created_at', { ascending: Boolean(parent) }).limit(100)
    if (result.error) return fail('Could not load discussions. Check the database setup.', 503)
    return json({ posts: result.data, moderator })
  } catch { return fail('Discussions are temporarily unavailable.', 503) }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) return fail('Please submit from this website.', 403)
    const raw = await request.text()
    if (raw.length > 6000) return fail('Submission is too large.', 413)
    let input: Record<string, unknown>
    try { input = JSON.parse(raw); if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error() } catch { return fail('Invalid submission.', 400) }
    const db = getSupabaseAdmin()
    if (!db) return fail('Discussions are not configured yet.', 503)
    const user = await identify(request, db)
    if (!user?.email_confirmed_at) return fail('Log in with a verified account to participate.', 401)
    if (input.action === 'post') {
      if (typeof input.body !== 'string' || input.body.trim().length < 10 || input.body.trim().length > 2000) return fail('Write a post of 10–2000 characters.', 400)
      if (input.parentId != null && !uuid(input.parentId)) return fail('Invalid discussion.', 400)
      const body = input.body.trim(), parentId = input.parentId || null
      // The database reserves a pending post and enforces limits atomically before any paid AI call.
      const saved = await db.rpc('submit_discussion_post', { p_author: user.id, p_body: body, p_parent: parentId })
      if (saved.error) {
        if (saved.error.code === 'P0001') return fail('Wait 30 seconds between posts. You can submit up to 20 posts per day.', 429)
        if (saved.error.code === 'P0002') return fail('You already submitted this post today. Check My posts.', 409)
        if (saved.error.code === 'P0003') return fail('This discussion is unavailable.', 409)
        return fail('Your post could not be saved. Check the database setup.', 503)
      }
      let context: string[] = []
      let contextAvailable = true
      if (parentId) {
        const [root, replies] = await Promise.all([
          db.from('discussion_posts').select('body').eq('id', parentId).eq('status', 'approved').maybeSingle(),
          db.from('discussion_posts').select('body').eq('parent_id', parentId).eq('status', 'approved').order('created_at', { ascending: false }).limit(4),
        ])
        contextAvailable = !root.error && !replies.error && Boolean(root.data)
        context = [root.data?.body, ...(replies.data || []).map(row => row.body).reverse()].filter((text): text is string => typeof text === 'string')
      }
      const decision = contextAvailable ? await moderateDiscussion(body, context) : { status: 'pending', flags: [], reason: 'Awaiting moderator review', source: 'fallback' }
      const updated = await db.from('discussion_posts').update({ status: decision.status, moderation: decision, revision: 1 })
        .eq('id', saved.data).eq('status', 'pending').eq('revision', 0).select(columns).maybeSingle()
      // A saved post must never be reported as lost after a model/write failure.
      if (updated.error || !updated.data) return json({ saved: true, id: saved.data, status: 'pending', message: 'Post saved. Check My posts for its current review status.' })
      return json({ saved: true, post: updated.data })
    }
    if (!['review', 'appeal'].includes(String(input.action))) return fail('Unknown discussion action.', 400)
    if (!uuid(input.id) || !Number.isInteger(input.revision) || Number(input.revision) < 0) return fail('Reload the post and try again.', 400)
    if (input.action === 'review' && !isDiscussionModerator(user)) return fail('Moderator access is required.', 403)
    const found = await db.from('discussion_posts').select('id,author_id,status,revision,appealed').eq('id', input.id).maybeSingle()
    if (found.error) return fail('Could not load the post.', 503)
    const post = found.data
    if (!post) return fail('Post not found.', 404)
    if (post.revision !== input.revision) return fail('This post changed. Reload before reviewing it.', 409)
    let changes: Record<string, unknown>
    if (input.action === 'appeal') {
      if (post.author_id !== user.id) return fail('You can appeal only your own posts.', 403)
      if (post.appealed || !['held', 'rejected'].includes(post.status)) return fail('This post is not eligible for another appeal.', 409)
      changes = { status: 'pending', appealed: true, reviewed_by: null, review_note: '', revision: post.revision + 1 }
    } else {
      if (!['approved', 'rejected'].includes(String(input.status)) || typeof input.note !== 'string' || input.note.trim().length < 3 || input.note.trim().length > 300) return fail('Choose approve or reject and enter a reason of 3–300 characters.', 400)
      changes = { status: input.status, reviewed_by: user.id, review_note: input.note.trim(), revision: post.revision + 1 }
    }
    const result = await db.from('discussion_posts').update(changes).eq('id', post.id).eq('revision', post.revision).select(columns).maybeSingle()
    if (result.error) return fail('Could not save the decision.', 503)
    if (!result.data) return fail('Another decision was saved first. Reload the queue.', 409)
    return json({ post: result.data })
  } catch { return fail('Discussions are temporarily unavailable. Check My posts before retrying a submission.', 503) }
}
