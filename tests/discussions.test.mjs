import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'

registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase-admin') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.discussionDb' }
  if (specifier === '@/lib/discussion-moderation') return next(new URL('../lib/discussion-moderation.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return { shortCircuit: true, url: 'data:text/javascript,export const NextResponse=Response' }
  return next(specifier, context)
} })
const { moderateDiscussion, isDiscussionModerator } = await import('../lib/discussion-moderation.ts')
const { GET, POST } = await import('../app/api/discussions/route.ts')
const safe = { spam: false, abuse: false, argument: false, inappropriate: false, uncertain: false, confidence: 0.99 }
const originalFetch = globalThis.fetch
function ai(value = safe, safety = { flagged: false, categories: {} }) {
  process.env.OPENAI_API_KEY = 'test-only'
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) })
    return Response.json(url.endsWith('/moderations') ? { results: [safety] } : { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] })
  }
  return calls
}

test('moderation only auto-approves a complete, confident pass; flags remain private', async () => {
  const calls = ai()
  assert.equal((await moderateDiscussion('Respectfully, I see this differently.', ['Earlier reply'])).status, 'approved')
  assert.equal(calls[1].body.store, false)
  assert.equal(JSON.parse(calls[1].body.input).replyContext[0], 'Earlier reply')
  for (const flag of ['spam', 'abuse', 'inappropriate']) {
    ai({ ...safe, [flag]: true })
    const result = await moderateDiscussion('A test community post')
    assert.equal(result.status, 'held'); assert.ok(result.flags.includes(flag))
  }
  ai({ ...safe, argument: true })
  assert.equal((await moderateDiscussion('A hostile exchange')).status, 'pending')
  ai(safe, { flagged: true, categories: { 'harassment/threatening': true } })
  assert.equal((await moderateDiscussion('A threatening post')).status, 'held')
  globalThis.fetch = originalFetch
})

test('uncertainty, missing configuration, HTTP errors, malformed output, refusals and outages never publish', async () => {
  for (const value of [{ ...safe, confidence: 0.94 }, { ...safe, uncertain: true }, { ...safe, spam: 'false' }, { ...safe, confidence: 2 }, {}]) {
    ai(value); assert.equal((await moderateDiscussion('A test post')).status, 'pending')
  }
  delete process.env.OPENAI_API_KEY
  globalThis.fetch = () => { throw new Error('Must not call without a key') }
  assert.equal((await moderateDiscussion('A test post')).status, 'pending')
  process.env.OPENAI_API_KEY = 'test-only'
  globalThis.fetch = async () => new Response('offline', { status: 503 })
  assert.equal((await moderateDiscussion('A test post')).status, 'pending')
  globalThis.fetch = async () => { throw new Error('timeout') }
  assert.equal((await moderateDiscussion('A test post')).status, 'pending')
  for (const output of [{ status: 'incomplete' }, { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }]) {
    globalThis.fetch = async url => Response.json(url.endsWith('/moderations') ? { results: [{ flagged: false, categories: {} }] } : output)
    assert.equal((await moderateDiscussion('A test post')).status, 'pending')
  }
  globalThis.fetch = originalFetch
  delete process.env.OPENAI_API_KEY
})

test('moderator access requires verified server-managed permissions', () => {
  process.env.MODERATOR_EMAILS = 'moderator@example.test'
  assert.equal(isDiscussionModerator({ email: 'moderator@example.test' }), false)
  assert.equal(isDiscussionModerator({ email: 'MODERATOR@example.test', email_confirmed_at: 'yes' }), true)
  assert.equal(isDiscussionModerator({ email_confirmed_at: 'yes', user_metadata: { discussion_moderator: true } }), false)
  assert.equal(isDiscussionModerator({ email_confirmed_at: 'yes', app_metadata: { discussion_moderator: true } }), true)
})

function database() {
  const rows = [], users = {
    member: { id: 'member', email_confirmed_at: 'yes', app_metadata: {} },
    other: { id: 'other', email_confirmed_at: 'yes', app_metadata: {} },
    moderator: { id: 'mod', email_confirmed_at: 'yes', app_metadata: { discussion_moderator: true } },
  }
  let sequence = 0
  const state = { rows, rpcError: null, failUpdate: false, race: false }
  globalThis.discussionDb = {
    auth: { getUser: async token => ({ data: { user: users[token] || null }, error: !users[token] }) },
    rpc: async (_name, input) => {
      if (state.rpcError) return { error: { code: state.rpcError } }
      const id = `00000000-0000-4000-a000-${String(++sequence).padStart(12, '0')}`
      rows.push({ id, author_id: input.p_author, body: input.p_body, parent_id: input.p_parent, status: 'pending', revision: 0, appealed: false, review_note: '', moderation: { source: 'fallback', flags: [], reason: 'Awaiting moderator review' }, created_at: new Date().toISOString() })
      return { data: id }
    },
    from: () => {
      let filters = [], payload, single = false, columns = '*', limit = 100
      const query = {
        select: value => { columns = value; return query },
        eq: (key, value) => { filters.push(row => row[key] === value); return query },
        is: (key, value) => { filters.push(row => row[key] === value); return query },
        in: (key, values) => { filters.push(row => values.includes(row[key])); return query },
        order: () => query, limit: value => { limit = value; return query },
        maybeSingle: () => { single = true; return query }, update: value => { payload = value; return query },
        then: (resolve, reject) => Promise.resolve().then(() => {
          if (payload && state.failUpdate) return { error: { message: 'offline' } }
          if (payload && state.race) return { data: null, error: null }
          const matched = rows.filter(row => filters.every(filter => filter(row))).slice(0, limit)
          if (payload) matched.forEach(row => Object.assign(row, payload))
          const projected = matched.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => columns === '*' || columns.split(',').includes(key))))
          return { data: single ? projected[0] || null : projected, error: null }
        }).then(resolve, reject),
      }
      return query
    },
  }
  return state
}
const post = (input, token = 'member', origin) => POST(new Request('https://example.test/api/discussions', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(origin ? { origin } : {}) }, body: JSON.stringify(input) }))
const get = (query = '', token) => GET(new Request(`https://example.test/api/discussions${query}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }))

test('API protects private posts, queues outages, publishes safe posts, and supports appeals plus moderator overrides', async () => {
  const state = database()
  delete process.env.OPENAI_API_KEY
  assert.equal((await post({ action: 'post', body: 'A community discussion' }, null)).status, 401)
  assert.equal((await post({ action: 'post', body: 'A community discussion' }, 'member', 'https://evil.test')).status, 403)
  assert.equal((await get('?view=review', 'member')).status, 403)
  let result = await (await post({ action: 'post', body: 'A respectful question about the local community' })).json()
  const pendingId = result.post.id
  assert.equal(result.post.status, 'pending')
  assert.equal((await (await get()).json()).posts.length, 0)
  assert.equal((await (await get('?view=mine', 'other')).json()).posts.length, 0)
  assert.equal((await (await get('?view=mine', 'member')).json()).posts.length, 1)
  assert.equal((await (await get('?view=review', 'moderator')).json()).posts.length, 1)
  assert.equal((await post({ action: 'review', id: pendingId, revision: 1, status: 'approved', note: 'Looks good' })).status, 403)
  result = await (await post({ action: 'review', id: pendingId, revision: 1, status: 'approved', note: 'Respectful discussion' }, 'moderator')).json()
  assert.equal(result.post.status, 'approved')
  const publicPosts = (await (await get()).json()).posts
  assert.equal(publicPosts.length, 1)
  assert.equal('author_id' in publicPosts[0], false)
  assert.equal('moderation' in publicPosts[0], false)
  assert.equal((await post({ action: 'review', id: pendingId, revision: 1, status: 'rejected', note: 'Stale decision' }, 'moderator')).status, 409)
  result = await (await post({ action: 'review', id: pendingId, revision: 2, status: 'rejected', note: 'Personal details need removing' }, 'moderator')).json()
  assert.equal(result.post.status, 'rejected')
  assert.equal((await post({ action: 'appeal', id: pendingId, revision: 3 }, 'other')).status, 403)
  result = await (await post({ action: 'appeal', id: pendingId, revision: 3 })).json()
  assert.equal(result.post.status, 'pending'); assert.equal(result.post.appealed, true)
  assert.equal((await post({ action: 'appeal', id: pendingId, revision: 4 })).status, 409)
  ai()
  result = await (await post({ action: 'post', body: 'Our community picnic is this weekend' })).json()
  assert.equal(result.post.status, 'approved')
  assert.equal((await (await get('?view=review&status=approved', 'moderator')).json()).posts.length, 1)
  // A reply cannot be read through a hidden thread, even if the reply itself was approved.
  state.rows.push({ id: '00000000-0000-4000-a000-000000000099', parent_id: pendingId, body: 'An approved reply', status: 'approved' })
  assert.equal((await get(`?thread=${pendingId}`)).status, 404)
  globalThis.fetch = originalFetch; delete process.env.OPENAI_API_KEY
})

test('rate limits and duplicates stop AI calls; failed writes and concurrent reviews do not lose saved posts', async () => {
  const state = database()
  const calls = ai()
  for (const [code, status] of [['P0001', 429], ['P0002', 409], ['P0003', 409]]) {
    state.rpcError = code
    assert.equal((await post({ action: 'post', body: 'A test community post' })).status, status)
  }
  assert.equal(calls.length, 0)
  state.rpcError = null; state.failUpdate = true
  const saved = await (await post({ action: 'post', body: 'A post whose decision write fails' })).json()
  assert.equal(saved.saved, true); assert.equal(state.rows.length, 1); assert.equal(state.rows[0].status, 'pending')
  state.failUpdate = false; state.race = true
  assert.equal((await post({ action: 'review', id: saved.id, revision: 0, status: 'approved', note: 'Concurrent decision' }, 'moderator')).status, 409)
  globalThis.fetch = originalFetch; delete process.env.OPENAI_API_KEY
})
