import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase-admin') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.communityDb' }
  if (specifier === 'next/server') return { shortCircuit: true, url: 'data:text/javascript,export const NextResponse=Response' }
  if (specifier === '@/lib/community-matching') return next(new URL('../lib/community-matching.ts', import.meta.url).href, context)
  if (specifier === '@/lib/interests') return next(new URL('../lib/interests.ts', import.meta.url).href, context)
  return next(specifier, context)
} })
const { matchingPreferences, recommendGroups, starterGroups, emptyMatchingPreferences } = await import('../lib/community-matching.ts')
const { GET, POST } = await import('../app/api/community/route.ts')
const preferences = { enabled: true, city: '  TORONTO,   Canada ', languages: ['Urdu', 'English'], goals: ['Learn Quran'], age: '18–24' }

test('recommendations explain city, language, goals, age and interest matches without requiring every field', () => {
  const parsed = matchingPreferences(preferences)
  const ranked = recommendGroups(starterGroups, parsed, ['quran'])
  assert.equal(ranked[0].id, 'toronto-learners')
  assert.ok(ranked[0].reasons.includes('Same city: Toronto, Canada'))
  assert.ok(ranked[0].reasons.some(reason => reason.includes('Shared language')))
  assert.ok(ranked[0].reasons.some(reason => reason.includes('Learning goals')))
  assert.ok(ranked[0].reasons.includes('Matches your saved interests'))
  assert.ok(ranked.find(group => group.id === 'young-adult-circle').reasons.some(reason => reason.includes('Same age bracket')))
  assert.equal(ranked.some(group => group.id === 'lifelong-circle'), false)
  assert.equal(recommendGroups(starterGroups, { ...parsed, city: 'Toronto, Australia' }, []).find(group => group.id === 'toronto-learners').reasons.some(reason => reason.startsWith('Same city')), false)
})
test('opt-out ignores saved profile information and never infers age from youth interests', () => {
  const results = recommendGroups(starterGroups, { ...preferences, enabled: false }, ['youth', 'quran'])
  assert.ok(results.every(group => group.score === 0 && group.reasons.length === 0))
  assert.ok(results.every(group => group.ages.length === 0))
  assert.equal(recommendGroups(starterGroups, { ...preferences, age: '' }, ['youth']).some(group => group.ages.length), false)
  assert.deepEqual(matchingPreferences({ ...emptyMatchingPreferences, languages: ['Urdu', 'Urdu'] }).languages, ['Urdu'])
})
test('untrusted matching input is validated against supported values', () => {
  for (const value of [null, [], {}, { ...preferences, age: '29' }, { ...preferences, city: 'x'.repeat(101) }, { ...preferences, goals: ['unknown'] }, { ...preferences, languages: 'Urdu' }, { ...preferences, enabled: 'yes' }]) assert.throws(() => matchingPreferences(value))
})

function database() {
  const state = { preferences: [], memberships: [], groups: starterGroups.map(group => ({ id: group.id, active: true, details: group })), fail: false }
  globalThis.communityDb = {
    auth: { getUser: async token => ({ data: { user: ['one', 'two'].includes(token) ? { id: token, email_confirmed_at: 'yes', user_metadata: { interests: ['quran'] } } : null }, error: !['one', 'two'].includes(token) }) },
    from: table => {
      const rows = table === 'community_groups' ? state.groups : table === 'community_matching_preferences' ? state.preferences : state.memberships
      let filters = [], payload, remove = false, single = false, columns = '*'
      const query = { select: value => { columns = value; return query }, eq: (key, value) => { filters.push(row => row[key] === value); return query }, order: () => query, limit: () => query, maybeSingle: () => { single = true; return query }, upsert: value => { payload = value; return query }, delete: () => { remove = true; return query }, then: (resolve, reject) => Promise.resolve().then(() => {
        if (state.fail) return { error: { message: 'offline' } }
        if (payload) { const existing = rows.find(row => row.user_id === payload.user_id && (!payload.group_id || row.group_id === payload.group_id)); if (existing) Object.assign(existing, payload); else rows.push(payload) }
        const matched = rows.filter(row => filters.every(filter => filter(row)))
        if (remove) matched.forEach(row => rows.splice(rows.indexOf(row), 1))
        const projected = matched.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => columns === '*' || columns.split(',').includes(key))))
        return { data: single ? projected[0] || null : projected, error: null }
      }).then(resolve, reject) }
      return query
    },
  }
  return state
}
const get = token => GET(new Request('https://example.test/api/community', { headers: token ? { authorization: `Bearer ${token}` } : {} }))
const post = (body, token = 'one', origin) => POST(new Request('https://example.test/api/community', { method: 'POST', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(origin ? { origin } : {}) }, body: JSON.stringify(body) }))
test('API saves only the authenticated account preferences and memberships, with no public profile exposure', async () => {
  const state = database()
  assert.equal((await post({ action: 'preferences', preferences }, null)).status, 401)
  assert.equal((await post({ action: 'preferences', preferences }, 'one', 'https://evil.test')).status, 403)
  assert.equal((await post({ action: 'preferences', preferences, user_id: 'two' })).status, 200)
  assert.equal(state.preferences[0].user_id, 'one')
  const mine = await (await get('one')).json()
  assert.equal(mine.groups[0].id, 'toronto-learners')
  const other = await (await get('two')).json()
  assert.equal(other.preferences.city, '')
  assert.ok(other.groups.every(group => group.score === 0))
  assert.equal((await post({ action: 'join', groupId: 'missing' })).status, 404)
  assert.equal((await post({ action: 'join', groupId: 'young-adult-circle' })).status, 200)
  assert.equal((await post({ action: 'join', groupId: 'young-adult-circle' })).status, 200)
  assert.equal(state.memberships.length, 1)
  assert.equal((await (await get('two')).json()).memberships.length, 0)
  assert.equal((await post({ action: 'clear' })).status, 200)
  const cleared = await (await get('one')).json()
  assert.equal(cleared.preferences.enabled, false)
  assert.ok(cleared.groups.some(group => group.id === 'young-adult-circle'), 'joined age group stays accessible so member can leave after clearing preferences')
  const guest = await (await get()).json()
  assert.equal(guest.memberships.length, 0)
  assert.equal(JSON.stringify(guest).includes('user_id'), false)
  assert.equal((await post({ action: 'leave', groupId: 'young-adult-circle' }, 'two')).status, 200)
  assert.equal(state.memberships.length, 1)
  assert.equal((await post({ action: 'leave', groupId: 'young-adult-circle' })).status, 200)
  assert.equal(state.memberships.length, 0)
  state.fail = true
  assert.equal((await get('one')).status, 503)
  assert.equal((await post({ action: 'preferences', preferences })).status, 503)
})
