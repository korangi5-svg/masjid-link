import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
registerHooks({ resolve(specifier,context,next) {
  if (specifier === '@/lib/supabase-admin') return {shortCircuit:true,url:'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.pathDb'}
  if (specifier === '@/lib/learning-path') return next(new URL('../lib/learning-path.ts',import.meta.url).href,context)
  if (specifier === 'next/server') return {shortCircuit:true,url:'data:text/javascript,export const NextResponse=Response'}
  return next(specifier,context)
} })
const {newMuslimModules,parsePathProgress,completePathModule}=await import('../lib/learning-path.ts')
const {GET,POST}=await import('../app/api/learning-path/route.ts')

test('progress accepts only the ordered module prefix',()=>{
  assert.deepEqual(parsePathProgress(undefined),{completed:[]})
  assert.deepEqual(parsePathProgress({completed:['salah','quran-basics','fake']}),{completed:[]})
  assert.deepEqual(parsePathProgress({completed:['shahadah','shahadah','wudu']}),{completed:['shahadah']})
  assert.deepEqual(newMuslimModules.map(module=>module.id),['shahadah','salah','wudu','quran-basics'])
})
test('cannot skip a module or unlock with an incorrect or malformed answer',()=>{
  assert.throws(()=>completePathModule({},'salah',1),/previous module/)
  assert.throws(()=>completePathModule({},'shahadah',2),/try the knowledge check/)
  assert.throws(()=>completePathModule({},'shahadah','0'),/try the knowledge check/)
  assert.throws(()=>completePathModule({},'fake',0),/Unknown/)
})
test('correct checks unlock one module at a time and repeat completions are idempotent',()=>{
  let progress={completed:[]}
  for(const module of newMuslimModules) {
    const previous=structuredClone(progress)
    progress=completePathModule(progress,module.id,module.answer)
    assert.equal(progress.completed.length,previous.completed.length+1)
    assert.deepEqual(completePathModule(progress,module.id,module.answer),progress)
    assert.deepEqual(previous.completed,progress.completed.slice(0,-1))
  }
  assert.equal(progress.completed.length,4)
})
test('API requires an authenticated account and uses server-managed progress',async()=>{
  globalThis.pathDb=null
  assert.equal((await GET(new Request('https://example.test'))).status,503)
  const user={id:'member',app_metadata:{other:'keep'},user_metadata:{new_muslim_path:{completed:newMuslimModules.map(m=>m.id)}}}
  let failSave=false
  globalThis.pathDb={auth:{getUser:async token=>token==='valid'?{data:{user},error:null}:{data:{user:null},error:{message:'invalid'}},admin:{updateUserById:async(id,{app_metadata})=>{assert.equal(id,'member');if(failSave)return {error:{message:'offline'}};user.app_metadata={...user.app_metadata,...app_metadata};return {error:null}}}}}
  const request=(body,token='valid')=>new Request('https://example.test',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)})
  assert.equal((await GET(new Request('https://example.test'))).status,401)
  assert.equal((await POST(request({moduleId:'shahadah',answer:0},'invalid'))).status,401)
  assert.deepEqual(await (await GET(new Request('https://example.test',{headers:{authorization:'Bearer valid'}}))).json(),{completed:[]})
  assert.equal((await POST(request({moduleId:'salah',answer:1}))).status,400)
  assert.equal((await POST(request(null))).status,400)
  failSave=true
  assert.equal((await POST(request({moduleId:'shahadah',answer:0}))).status,503)
  assert.equal(user.app_metadata.new_muslim_path,undefined)
  failSave=false
  const saved=await POST(request({moduleId:'shahadah',answer:0,userId:'someone-else'}))
  assert.equal(saved.status,200)
  assert.deepEqual(await saved.json(),{completed:['shahadah']})
  assert.equal(user.app_metadata.other,'keep')
  assert.deepEqual(await (await GET(new Request('https://example.test',{headers:{authorization:'Bearer valid'}}))).json(),{completed:['shahadah']})
})
