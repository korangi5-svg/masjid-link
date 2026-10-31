import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabase=()=>globalThis.followDb' }
  if (specifier === '@/lib/supabase-admin') return { shortCircuit: true, url: 'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.adminDb' }
  if (specifier === 'next/server') return { shortCircuit: true, url: 'data:text/javascript,export const NextResponse=Response' }
  if (specifier.startsWith('@/lib/')) return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context)
  if (['./interests', './recommendations'].includes(specifier)) return next(new URL(`../lib/${specifier.slice(2)}.ts`, import.meta.url).href, context)
  return next(specifier, context)
} })
const { parseFollowPreferences, updateFollowPreferences, scholarUpdates, weeklyDigest, similarScholars, digestWeek } = await import('../lib/scholar-follow.ts')
const { saveRecommendationActivity, saveFollowPreferences } = await import('../lib/services/recommendation-activity.ts')
const { contentCatalog } = await import('../lib/recommendations.ts')
const { GET } = await import('../app/api/cron/scholar-digest/route.ts')
const now=Date.UTC(2026,9,31,12), day=86400000
const activity={ enabled:true, followedScholars:['omar-suleiman'] }
const prefs={ inApp:true, weeklyEmail:true, emailSince:now-10*day, since:{'omar-suleiman':now-10*day}, read:[] }
const base=contentCatalog.find(item=>item.id==='firsts-podcast')
const item=(id,ago)=>({...base,id,publishedAt:new Date(now-ago*day).toISOString()})

test('only valid new content attributed to followed scholars generates an update',()=>{
  const catalog=[item('new',1),item('old',11),item('future',-1),{...base,id:'undated'}, {...item('bad-date',1),publishedAt:'invalid'}, {...item('other',1),scholarIds:['nouman-ali-khan']}]
  assert.deepEqual(scholarUpdates(activity,prefs,now,catalog).map(x=>x.id),['new'])
  assert.equal(scholarUpdates({...activity,followedScholars:[]},prefs,now,catalog).length,0)
  assert.equal(scholarUpdates(activity,{},now,catalog).length,0)
})
test('digest excludes pre-follow, pre-opt-in and older-than-seven-day content',()=>{
  const catalog=[item('new',1),item('week-old',7),item('older',8)]
  assert.deepEqual(weeklyDigest(activity,prefs,now,catalog).map(x=>x.id),['new'])
  assert.equal(weeklyDigest(activity,{...prefs,emailSince:now},now,catalog).length,0)
  assert.equal(weeklyDigest(activity,{...prefs,since:{'omar-suleiman':now}},now,catalog).length,0)
})
test('preferences are opt-in for email and untrusted timestamps/read lists are bounded',()=>{
  assert.equal(parseFollowPreferences(undefined,now).weeklyEmail,false)
  const parsed=parseFollowPreferences({weeklyEmail:'true',emailSince:now+day,since:{fake:now,'omar-suleiman':now+day},read:Array.from({length:300},(_,i)=>String(i))},now)
  assert.equal(parsed.weeklyEmail,false);assert.equal(parsed.emailSince,0);assert.deepEqual(parsed.since,{});assert.equal(parsed.read.length,128)
  const enabled=updateFollowPreferences({}, {type:'notifications',inApp:true,weeklyEmail:true},now)
  assert.equal(enabled.emailSince,now)
  assert.equal(updateFollowPreferences(enabled,{type:'notifications',inApp:false,weeklyEmail:true},now+day).emailSince,now)
})
test('recommendations exclude followed scholars and explain shared attributed topics',()=>{
  const results=similarScholars(activity)
  assert.equal(results.length,1);assert.equal(results[0].id,'nouman-ali-khan');assert.ok(results[0].sharedTopics.includes('quran'))
  assert.equal(similarScholars({}).length,0)
})
test('read markers merge, notification settings preserve profile/activity, refollows reset baseline',async()=>{
  let user={id:'a',user_metadata:{full_name:'Member',recommendation_activity:activity,scholar_notifications:prefs}}
  globalThis.followDb={auth:{getUser:async()=>({data:{user:structuredClone(user)}}),updateUser:async({data})=>{user.user_metadata={...user.user_metadata,...data};return {error:null}}}}
  await Promise.all([saveFollowPreferences('a',{type:'read-notifications',ids:['one']}),saveFollowPreferences('a',{type:'read-notifications',ids:['two']})])
  assert.deepEqual(user.user_metadata.scholar_notifications.read,['one','two']);assert.equal(user.user_metadata.full_name,'Member')
  await saveRecommendationActivity('a',{type:'follow',scholarId:'omar-suleiman',following:false})
  assert.equal(user.user_metadata.scholar_notifications.since['omar-suleiman'],undefined)
  const beforeRefollow=Date.now()
  await saveRecommendationActivity('a',{type:'follow',scholarId:'omar-suleiman',following:true})
  assert.ok(user.user_metadata.scholar_notifications.since['omar-suleiman']>=beforeRefollow)
  user={id:'b',user_metadata:{}}
  await assert.rejects(saveFollowPreferences('a',{type:'notifications',inApp:true,weeklyEmail:true}),/session changed/)
})
test('cron rejects unauthenticated calls and reports missing delivery configuration',async()=>{
  process.env.CRON_SECRET='test-secret'; delete process.env.SCHOLAR_FROM_EMAIL
  assert.equal((await GET(new Request('https://example.test'))).status,401)
  assert.equal((await GET(new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}}))).status,503)
})
test('weekly delivery skips unconfirmed, opted-out, already-sent and empty subscribers; records acceptance',async()=>{
  const realNow=Date.now,realFetch=globalThis.fetch
  Date.now=()=>now
  contentCatalog.push(item('test-published',1))
  let sends=0,updates=0
  const user={id:'member',email:'member@example.test',email_confirmed_at:'2026-01-01',user_metadata:{recommendation_activity:activity,scholar_notifications:prefs},app_metadata:{other:'preserved'}}
  globalThis.adminDb={auth:{admin:{listUsers:async()=>({data:{users:[user]},error:null}),getUserById:async()=>({data:{user},error:null}),updateUserById:async(id,{app_metadata})=>{updates++;user.app_metadata=app_metadata;return {error:null}}}}}
  process.env.RESEND_API_KEY='test';process.env.SCHOLAR_FROM_EMAIL='Masjid Link <digest@example.test>'
  const request=()=>new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}})
  globalThis.fetch=async(url,options)=>{sends++;assert.match(options.headers['Idempotency-Key'],/scholar-digest\/member\//);assert.equal(JSON.parse(options.body).to[0],user.email);return Response.json({id:'email-id'})}
  try {
    user.email_confirmed_at=null;assert.equal((await (await GET(request())).json()).sent,0)
    user.email_confirmed_at='2026-01-01';user.user_metadata.scholar_notifications={...prefs,weeklyEmail:false};await GET(request());assert.equal(sends,0)
    user.user_metadata.scholar_notifications=prefs
    assert.equal((await (await GET(request())).json()).sent,1);assert.equal(updates,1);assert.equal(user.app_metadata.other,'preserved');assert.equal(user.app_metadata.scholar_digest_week,digestWeek(now))
    await GET(request());assert.equal(sends,1)
    user.app_metadata={};globalThis.fetch=async()=>Response.json({error:'rejected'},{status:403})
    assert.equal((await GET(request())).status,502);assert.equal(user.app_metadata.scholar_digest_week,undefined)
  } finally {Date.now=realNow;globalThis.fetch=realFetch;contentCatalog.pop()}
})
