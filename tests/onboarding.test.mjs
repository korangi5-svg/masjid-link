import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Exercise the real TypeScript modules with a deterministic Supabase boundary.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/lib/supabase') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabase=()=>globalThis.authStub;export const setRememberSession=()=>{}' }
    if (specifier === '@/lib/interests') return nextResolve(new URL('../lib/interests.ts', import.meta.url).href, context)
    if (specifier === './interests') return nextResolve(new URL('../lib/interests.ts', import.meta.url).href, context)
    return nextResolve(specifier, context)
  },
})
const { interests, parseInterests, hasCompletedOnboarding } = await import('../lib/interests.ts')
const { learningResources, recommendResources } = await import('../lib/recommendations.ts')
const { signUp } = await import('../lib/services/auth.ts')

test('accepts only the six supported interests and removes duplicates', () => {
  assert.deepEqual(parseInterests(['quran', 'quran', 'invalid', null, 'youth']), ['quran', 'youth'])
  for (const value of [null, undefined, {}, 'quran']) assert.deepEqual(parseInterests(value), [])
  assert.equal(interests.length, 6)
})
test('onboarding requires both a completion marker and valid saved interests', () => {
  assert.equal(hasCompletedOnboarding(undefined), false)
  assert.equal(hasCompletedOnboarding({ interests: ['quran'] }), false)
  assert.equal(hasCompletedOnboarding({ onboarding_completed: true, interests: ['unknown'] }), false)
  assert.equal(hasCompletedOnboarding({ onboarding_completed: true, interests: ['quran'] }), true)
})
test('every interest receives matching content, without unrelated results', () => {
  for (const { id } of interests) {
    const results = recommendResources([id])
    assert.ok(results.length > 0, id)
    assert.ok(results.every((r) => r.matchedInterests.includes(id)))
  }
  assert.deepEqual(recommendResources([]), [])
  assert.deepEqual(recommendResources(['invalid']), [])
})
test('feed ranks shared matches first and removes duplicate destinations', () => {
  const results = recommendResources(['quran', 'tafsir'], [...learningResources, learningResources[0]])
  assert.equal(results[0].id, 'tafsir')
  assert.equal(new Set(results.map((r) => r.href)).size, results.length)
  assert.ok(recommendResources(['parenting']).every((r) => !recommendResources(['quran']).some((q) => q.id === r.id)))
})
test('signup saves profile details and interests together and preserves confirmation', async () => {
  let input
  globalThis.window = { location: { origin: 'https://example.test' } }
  globalThis.authStub = { auth: { signUp: async (value) => { input = value; return { data: { session: null }, error: null } } } }
  const result = await signUp({ fullName: 'Test Member', email: 'test@example.test', password: 'Example123', location: 'Toronto', interests: ['quran', 'youth'] })
  assert.equal(result.ok, true)
  assert.equal(result.data.needsConfirmation, true)
  assert.deepEqual(input.options.data, { full_name: 'Test Member', location: 'Toronto', interests: ['quran', 'youth'], onboarding_completed: true })
  assert.equal(input.options.emailRedirectTo, 'https://example.test/')
})
test('signup rejects empty interests and surfaces authentication failures', async () => {
  const base = { fullName: 'Test', email: 'test@example.test', password: 'Example123', location: 'Toronto' }
  globalThis.authStub = { auth: { signUp: async () => { throw new Error('Must not create an account') } } }
  assert.equal((await signUp({ ...base, interests: [] })).ok, false)
  globalThis.authStub = { auth: { signUp: async () => ({ data: {}, error: { code: 'email_exists' } }) } }
  assert.equal((await signUp({ ...base, interests: ['quran'] })).error, 'An account with this email already exists.')
  globalThis.authStub = { auth: { signUp: async () => ({ data: { session: { user: {} } }, error: null }) } }
  assert.equal((await signUp({ ...base, interests: ['quran'] })).data.needsConfirmation, false)
})
