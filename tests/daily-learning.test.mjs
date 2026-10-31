import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase-admin') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.dailyDb' }
  if (specifier === 'next/server') return { shortCircuit: true, url: 'data:text/javascript,export const NextResponse=Response' }
  if (specifier === '@/lib/daily-learning') return next(new URL('../lib/daily-learning.ts', import.meta.url).href, context)
  return next(specifier, context)
} })
const { learningDate, dailyLesson, dailyPreferences, dailyEmailText } = await import('../lib/daily-learning.ts')
const { GET } = await import('../app/api/cron/daily-learning/route.ts')

test('Toronto date changes at local midnight, including daylight-saving changes', () => {
  assert.equal(learningDate(Date.parse('2026-11-01T03:59:00Z')), '2026-10-31')
  assert.equal(learningDate(Date.parse('2026-11-01T04:00:00Z')), '2026-11-01')
  assert.equal(learningDate(Date.parse('2026-11-02T04:59:00Z')), '2026-11-01')
  assert.equal(learningDate(Date.parse('2026-11-02T05:00:00Z')), '2026-11-02')
})
test('seven daily practices retain scripture sources and adapt family/foundation actions', () => {
  const now = Date.parse('2026-10-31T12:00:00Z')
  const titles = new Set()
  for (let i=0;i<7;i++) {
    const lesson = dailyLesson([], now+i*86400000)
    titles.add(lesson.title)
    assert.match(lesson.verse.href, /^https:\/\/quran.com\//)
    assert.match(lesson.hadith.href, /^https:\/\/sunnah.com\//)
    assert.ok(lesson.dua.arabic && lesson.reflection && lesson.lesson)
    assert.match(dailyEmailText(lesson), /daily-learning/)
  }
  assert.equal(titles.size,7)
  assert.match(dailyLesson(['parenting'],now).action,/family member/)
  assert.match(dailyLesson(['new-muslims'],now).action,/one step/)
  assert.deepEqual(dailyPreferences({email:'true',inApp:false,readDate:'invalid'}),{email:false,inApp:false,readDate:''})
})
test('daily mail rejects unauthenticated calls and missing sender configuration', async () => {
  process.env.CRON_SECRET='test-secret';delete process.env.RESEND_API_KEY
  assert.equal((await GET(new Request('https://example.test'))).status,401)
  assert.equal((await GET(new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}}))).status,503)
})
test('daily mail honors opt-in and confirmation, avoids repeat sends, preserves metadata and reports failures', async () => {
  const realFetch = globalThis.fetch
  const user = {id:'member',email:'member@example.test',email_confirmed_at:null,user_metadata:{interests:['parenting'],daily_learning:{email:true}},app_metadata:{other:'preserved'}}
  globalThis.dailyDb = {auth:{admin:{listUsers:async()=>({data:{users:[user]}}),getUserById:async()=>({data:{user}}),updateUserById:async(id,{app_metadata})=>{user.app_metadata=app_metadata;return {error:null}}}}}
  process.env.RESEND_API_KEY='test';process.env.DAILY_FROM_EMAIL='Daily <daily@example.test>'
  let sends=0
  globalThis.fetch=async(url,options)=>{sends++;assert.equal(JSON.parse(options.body).to[0],user.email);assert.match(options.headers['Idempotency-Key'],/daily-learning\/member\/\d{4}-\d{2}-\d{2}/);return Response.json({id:'accepted'})}
  const request=()=>new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}})
  try {
    await GET(request());assert.equal(sends,0)
    user.email_confirmed_at='2026-01-01';user.user_metadata.daily_learning.email=false
    await GET(request());assert.equal(sends,0)
    user.user_metadata.daily_learning.email=true
    assert.equal((await (await GET(request())).json()).sent,1)
    assert.equal(user.app_metadata.other,'preserved')
    await GET(request());assert.equal(sends,1)
    user.app_metadata={};globalThis.fetch=async()=>Response.json({error:'rejected'},{status:403})
    assert.equal((await GET(request())).status,502)
    assert.equal(user.app_metadata.daily_learning_date,undefined)
  } finally { globalThis.fetch=realFetch }
})
