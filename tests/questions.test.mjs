import assert from 'node:assert/strict'
import {test} from 'node:test'
import {registerHooks} from 'node:module'
registerHooks({resolve(specifier,context,next){
  if(specifier==='@/lib/supabase-admin')return{shortCircuit:true,url:'data:text/javascript,export const getSupabaseAdmin=()=>globalThis.qaDb'}
  if(specifier==='@/lib/site')return{shortCircuit:true,url:'data:text/javascript,export const contactInfo={email:"mohammad.arifkhan10@outlook.com"}'}
  if(specifier==='@/lib/questions')return next(new URL('../lib/questions.ts',import.meta.url).href,context)
  if(specifier==='next/server')return{shortCircuit:true,url:'data:text/javascript,export const NextResponse=Response'}
  return next(specifier,context)
}})
const {routeQuestion,classifyQuestion,isQuestionReviewer}=await import('../lib/questions.ts')
const {GET,POST}=await import('../app/api/questions/route.ts')
test('common wording and synonyms retrieve sourced existing answers without escalation',()=>{
  for(const question of ['What is wudu?','How do I perform wudhu?','What does the Shahadah mean?','How do I unlock the next module?','Dua before studying']){
    const result=routeQuestion(question)
    assert.equal(result.needsReview,false,question)
    assert.ok(result.suggestions[0].strong)
    assert.ok(result.suggestions[0].sources.length)
  }
  assert.equal(routeQuestion('Dua before studying').category,'Dua')
})
test('qualifiers and unknown topics route to review, related reading is not an answer',()=>{
  const result=routeQuestion('Does bleeding break my wudu?')
  assert.equal(result.needsReview,true);assert.equal(result.category,'Purification')
  assert.equal(result.suggestions[0].strong,false)
  assert.equal(routeQuestion('How should I divide an inheritance between my relatives?').needsReview,true)
  assert.equal(classifyQuestion('How do I unlock modules?'),'Learning')
})
test('reviewer access requires a verified identity and ignores user-editable metadata',()=>{
  const allowed='mohammad.arifkhan10@outlook.com'
  assert.equal(isQuestionReviewer({email:allowed},allowed),false)
  assert.equal(isQuestionReviewer({email:allowed,email_confirmed_at:'yes'},allowed),true)
  assert.equal(isQuestionReviewer({email:'member@example.test',email_confirmed_at:'yes',user_metadata:{qa_reviewer:true}},allowed),false)
})
test('API persists unanswered questions, deduplicates, protects private replies, and publishes only reviewer-approved answers',async()=>{
  const rows=[]
  let failWrite=false
  const users={member:{id:'member',email:'member@example.test',email_confirmed_at:'yes',app_metadata:{}},reviewer:{id:'owner',email:'mohammad.arifkhan10@outlook.com',email_confirmed_at:'yes',app_metadata:{}}}
  globalThis.qaDb={auth:{getUser:async token=>({data:{user:users[token]||null},error:users[token]?null:{message:'bad'}})},from:()=>{
    let mode='read',payload,filters=[],single=false,count=false,max=Infinity
    const query={select:(_cols,options)=>{count=options?.count==='exact';return query},eq:(key,value)=>{filters.push(row=>row[key]===value);return query},like:(key,value)=>{filters.push(row=>row[key].startsWith(value.replace('%','')));return query},gte:()=>query,order:()=>query,limit:value=>{max=value;return query},maybeSingle:()=>{single=true;return query},insert:value=>{mode='insert';payload=value;return query},update:value=>{mode='update';payload=value;return query},then:(resolve,reject)=>Promise.resolve().then(()=>{
      let matched=rows.filter(row=>filters.every(filter=>filter(row))).slice(0,max)
      if(mode!=='read'&&failWrite)return{data:null,error:{code:'offline'}}
      if(mode==='insert'){if(rows.some(row=>row.id===payload.id))return{error:{code:'23505'}};rows.push({...payload,created_at:new Date().toISOString()});return{data:null,error:null}}
      if(mode==='update')matched.forEach(row=>Object.assign(row,payload))
      return{data:single?(matched[0]||null):matched,error:null,...(count?{count:matched.length}:{})}
    }).then(resolve,reject)}
    return query
  }}
  const post=(body,token)=>POST(new Request('https://example.test/api/questions',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)}))
  const get=(token,review=false)=>GET(new Request(`https://example.test/api/questions${review?'?review=1':''}`,{headers:token?{authorization:`Bearer ${token}`}:{}}))
  const question='How should I divide an inheritance between my relatives?'
  let response=await post({action:'ask',question})
  assert.equal((await response.json()).signInRequired,true);assert.equal(rows.length,0)
  assert.equal((await get('member',true)).status,403)
  failWrite=true;assert.equal((await post({action:'ask',question},'member')).status,503);assert.equal(rows.length,0)
  failWrite=false;response=await post({action:'ask',question},'member')
  let result=await response.json();assert.equal(result.queued,true);const id=result.ticketId;assert.equal(rows.length,1)
  result=await (await post({action:'ask',question},'member')).json();assert.equal(result.duplicate,true);assert.equal(rows.length,1)
  assert.equal((await (await get()).json()).tickets.length,0)
  assert.equal((await (await get('member')).json()).tickets.length,1)
  assert.equal((await (await get('reviewer',true)).json()).tickets.length,1)
  assert.equal((await post({action:'answer',id,answer:'This requires qualified guidance about the specific estate.',category:'General'},'member')).status,403)
  assert.equal((await post({action:'answer',id,answer:'This requires qualified guidance about the specific estate.',category:'General',publish:true},'reviewer')).status,400)
  assert.equal((await post({action:'answer',id,answer:'This requires qualified guidance about the specific estate.',category:'General',publish:false},'reviewer')).status,200)
  assert.equal((await (await get('member')).json()).tickets[0].status,'answered')
  assert.equal((await (await get()).json()).answers.some(answer=>answer.id===id),false)
  const question2='What is a Quran reading practice for a beginner with five minutes?'
  result=await (await post({action:'escalate',question:question2},'member')).json()
  const id2=result.ticketId
  assert.equal((await post({action:'answer',id:id2,answer:'Listen to a short recitation, read its meaning, and return tomorrow.',category:'Quran',publish:true,sources:[{label:'Quran',href:'javascript:alert(1)'}]},'reviewer')).status,400)
  assert.equal((await post({action:'answer',id:id2,answer:'Listen to a short recitation, read its meaning, and return tomorrow.',category:'Quran',publish:true,sources:[{label:'Quran 73:4',href:'https://quran.com/73/4'}]},'reviewer')).status,200)
  const publicData=await (await get()).json()
  assert.ok(publicData.answers.some(answer=>answer.id===id2))
  assert.equal(JSON.stringify(publicData).includes('member@example.test'),false)
  result=await (await post({action:'ask',question:question2})).json();assert.equal(result.needsReview,false)
})
