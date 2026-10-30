import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabase=()=>globalThis.activitySupabase' }
  if (specifier.startsWith('@/lib/')) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context)
  if (specifier === './interests' || specifier === './recommendations') return next(new URL(`../lib/${specifier.slice(2)}.ts`, import.meta.url).href, context)
  return next(specifier, context)
} })
const { contentCatalog, contentKinds } = await import('../lib/recommendations.ts')
const { applyActivityAction, parseActivity, rankRecommendations, searchTopics } = await import('../lib/recommendation-engine.ts')
const { saveRecommendationActivity } = await import('../lib/services/recommendation-activity.ts')
const now = Date.UTC(2026, 9, 30)
const day = 86400000
const enabled = () => applyActivityAction(undefined, { type: 'enable', enabled: true }, now)

test('catalogue covers all four formats and has unique, safe destinations', () => {
  assert.deepEqual([...new Set(contentCatalog.map((item) => item.kind))].sort(), [...contentKinds].sort())
  assert.equal(new Set(contentCatalog.map((item) => item.id)).size, contentCatalog.length)
  for (const item of contentCatalog) { assert.ok(item.interests.length); assert.equal(new URL(item.href).protocol, 'https:') }
})
test('cold start and paused feeds ignore all behavioral signals', () => {
  const initial = rankRecommendations(['parenting'], undefined, now)
  assert.equal(initial[0].id, 'parenting')
  const paused = { enabled: false, completed: [{ contentId: 'parenting', action: 'read', at: now }], searches: [{ topics: ['quran'], at: now }], followedScholars: ['omar-suleiman'] }
  assert.deepEqual(rankRecommendations(['parenting'], paused, now), initial)
  assert.equal(rankRecommendations([], undefined, now).length, contentCatalog.length)
})
test('read articles and watched lectures influence related unseen content', () => {
  const read = applyActivityAction(enabled(), { type: 'complete', contentId: 'parenting' }, now)
  const feed = rankRecommendations([], read, now)
  assert.equal(feed.some((item) => item.id === 'parenting'), false)
  assert.ok(feed.find((item) => item.id === 'parenting-webinar').score > 0)
  assert.match(feed.find((item) => item.id === 'parenting-webinar').reason, /your learning/)
  const watched = applyActivityAction(enabled(), { type: 'complete', contentId: 'quran-30-lectures' }, now)
  assert.equal(watched.completed[0].action, 'watched')
  assert.ok(rankRecommendations([], watched, now).find((item) => item.id === 'quran-30-podcast').score > 0)
  assert.equal(applyActivityAction(watched, { type: 'complete', contentId: 'quran-30-lectures' }, now).completed.length, 1)
})
test('courses and podcasts produce the right completion types; undo restores recommendations', () => {
  let activity = applyActivityAction(enabled(), { type: 'complete', contentId: 'bayyinah-courses' }, now)
  assert.equal(activity.completed[0].action, 'completed')
  activity = applyActivityAction(activity, { type: 'complete', contentId: 'firsts-podcast' }, now)
  assert.equal(activity.completed[0].action, 'listened')
  activity = applyActivityAction(activity, { type: 'undo', contentId: 'firsts-podcast' }, now)
  assert.ok(rankRecommendations([], activity, now).some((item) => item.id === 'firsts-podcast'))
})
test('following boosts only content attributed to that scholar; unfollow removes the boost', () => {
  const follow = applyActivityAction(enabled(), { type: 'follow', scholarId: 'nouman-ali-khan', following: true }, now)
  const feed = rankRecommendations([], follow, now)
  assert.equal(feed[0].id, 'bayyinah-courses')
  assert.match(feed[0].reason, /Nouman Ali Khan/)
  assert.equal(feed.find((item) => item.id === 'firsts-podcast').score, 0)
  const unfollow = applyActivityAction(follow, { type: 'follow', scholarId: 'nouman-ali-khan', following: false }, now)
  assert.equal(rankRecommendations([], unfollow, now).find((item) => item.id === 'bayyinah-courses').score, 0)
})
test('topic searches affect the feed without retaining raw text or duplicate search weights', () => {
  assert.deepEqual(searchTopics('Qur’an tafseer for families'), ['quran', 'tafsir', 'parenting'])
  const action = { type: 'search', query: 'I am a new Muslim in my private city' }
  let activity = applyActivityAction(enabled(), action, now)
  activity = applyActivityAction(activity, action, now)
  assert.equal(activity.searches.length, 1)
  assert.deepEqual(activity.searches[0].topics, ['new-muslims'])
  assert.equal(JSON.stringify(activity).includes('private'), false)
  assert.match(rankRecommendations([], activity, now).find((item) => item.id === 'new-muslims').reason, /searched/)
  assert.deepEqual(applyActivityAction(activity, { type: 'search', query: 'unrecognized' }, now), activity)
})
test('history decays and malformed, future, expired, and unknown records are rejected', () => {
  const recent = applyActivityAction(enabled(), { type: 'complete', contentId: 'quran' }, now)
  const old = { ...recent, completed: [{ contentId: 'quran', action: 'read', at: now - 90 * day }] }
  assert.ok(rankRecommendations([], recent, now).find((item) => item.id === 'tafsir').score > rankRecommendations([], old, now).find((item) => item.id === 'tafsir').score)
  const parsed = parseActivity({ enabled: true, completed: [null, { contentId: 'quran', action: 'watched', at: now }, { contentId: 'bad-id', action: 'read', at: now }, { contentId: 'quran', action: 'read', at: now + day }, { contentId: 'quran', action: 'read', at: now - 181 * day }], searches: [{ topics: ['bad'], at: now }], followedScholars: ['fake-scholar'] }, now)
  assert.deepEqual(parsed, enabled())
  const searches = Array.from({ length: 30 }, (_, i) => ({ topics: ['quran'], at: now - i }))
  assert.equal(parseActivity({ searches }, now).searches.length, 12)
})
test('disabled collection does not save events; clear removes all activity and follows', () => {
  const off = parseActivity(undefined, now)
  for (const action of [{ type: 'complete', contentId: 'quran' }, { type: 'search', query: 'Quran' }, { type: 'follow', scholarId: 'omar-suleiman', following: true }]) assert.deepEqual(applyActivityAction(off, action, now), off)
  const cleared = applyActivityAction({ ...enabled(), completed: [{ contentId: 'quran', action: 'read', at: now }], followedScholars: ['omar-suleiman'], searches: [{ topics: ['quran'], at: now }] }, { type: 'clear' }, now)
  assert.deepEqual(cleared, enabled())
})
test('writes merge rapid actions, preserve profile metadata, and cannot save to a different account', async () => {
  let user = { id: 'member-a', user_metadata: { full_name: 'Member', interests: ['quran'], recommendation_activity: { enabled: true } } }
  globalThis.activitySupabase = { auth: {
    getUser: async () => ({ data: { user: structuredClone(user) }, error: null }),
    updateUser: async ({ data }) => { user.user_metadata = { ...user.user_metadata, ...data }; return { error: null } },
  } }
  await Promise.all([saveRecommendationActivity('member-a', { type: 'complete', contentId: 'quran' }), saveRecommendationActivity('member-a', { type: 'follow', scholarId: 'omar-suleiman', following: true })])
  assert.equal(user.user_metadata.full_name, 'Member')
  assert.deepEqual(user.user_metadata.interests, ['quran'])
  assert.equal(user.user_metadata.recommendation_activity.completed.length, 1)
  assert.deepEqual(user.user_metadata.recommendation_activity.followedScholars, ['omar-suleiman'])
  user = { id: 'member-b', user_metadata: {} }
  await assert.rejects(saveRecommendationActivity('member-a', { type: 'complete', contentId: 'quran' }), /session changed/)
  assert.deepEqual(user.user_metadata, {})
})
test('failed writes surface errors and do not poison the write queue', async () => {
  const user = { id: 'member', user_metadata: {} }
  globalThis.activitySupabase = { auth: { getUser: async () => ({ data: { user }, error: null }), updateUser: async () => ({ error: { message: 'failure' } }) } }
  await assert.rejects(saveRecommendationActivity('member', { type: 'enable', enabled: true }), /Could not save/)
  globalThis.activitySupabase.auth.updateUser = async () => ({ error: null })
  assert.equal((await saveRecommendationActivity('member', { type: 'enable', enabled: true })).enabled, true)
})
