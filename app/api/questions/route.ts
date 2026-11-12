import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getQuestionCatalog } from '@/lib/services/question-catalog'
import { contactInfo } from '@/lib/site'
import { routeQuestion, normalizeQuestion, parseTicket, isQuestionReviewer, questionCategories, type QuestionTicket } from '@/lib/questions'

export const dynamic='force-dynamic'
const fail=(error:string,status:number)=>NextResponse.json({error},{status})
const attempts=new Map<string,{count:number;until:number}>()
async function identify(request:Request,db:NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if(!token)return null
  const result=await db.auth.getUser(token)
  return result.error ? null : result.data.user
}
const reviewer=(user:Parameters<typeof isQuestionReviewer>[0])=>isQuestionReviewer(user,process.env.QA_REVIEWER_EMAILS||contactInfo.email)
export async function GET(request:Request) {
  try {
    const db=getSupabaseAdmin(), user=db?await identify(request,db):null
    if(new URL(request.url).searchParams.get('review')==='1') {
      if(!user||!reviewer(user))return fail('Reviewer access is required.',403)
      const result=await db!.from('contact_messages').select('id,message,created_at').eq('subject','QA:pending').order('created_at',{ascending:true}).limit(100)
      if(result.error)return fail('The review queue is unavailable. Please try again.',503)
      return NextResponse.json({tickets:(result.data||[]).flatMap(row=>{const ticket=parseTicket(row.message);return ticket?[{id:row.id,createdAt:row.created_at,...ticket}]:[]})},{headers:{'Cache-Control':'private, no-store'}})
    }
    const kb=await getQuestionCatalog(db)
    let tickets:unknown[]=[]
    if(user&&db) {
      const result=await db.from('contact_messages').select('id,message,created_at').eq('email',user.email!).like('subject','QA:%').order('created_at',{ascending:false}).limit(50)
      if(result.error)return fail('Could not load your questions. Please try again.',503)
      tickets=(result.data||[]).flatMap(row=>{const ticket=parseTicket(row.message);return ticket?.ownerId===user.id?[{id:row.id,createdAt:row.created_at,...ticket}]:[]})
    }
    return NextResponse.json({answers:kb.items,queueAvailable:kb.available,tickets,reviewer:Boolean(user&&reviewer(user))},{headers:{'Cache-Control':'private, no-store'}})
  }catch{return fail('Question service is temporarily unavailable.',503)}
}
export async function POST(request:Request) {
  try {
    const origin=request.headers.get('origin')
    if(origin&&origin!==new URL(request.url).origin)return fail('Please submit from this website.',403)
    const text=await request.text()
    if(text.length>7000)return fail('Question submission is too large.',413)
    let input:Record<string,unknown>
    try{input=JSON.parse(text);if(!input||typeof input!=='object'||Array.isArray(input))throw new Error()}catch{return fail('Invalid submission.',400)}
    const db=getSupabaseAdmin(),user=db?await identify(request,db):null
    if(request.headers.has('authorization')&&!user)return fail('Your session expired. Please log in again.',401)
    if(input.action==='answer') {
      if(!user||!reviewer(user))return fail('Reviewer access is required.',403)
      if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id)||typeof input.answer!=='string'||input.answer.trim().length<20||input.answer.length>2000||!questionCategories.includes(input.category as never))return fail('Enter an answer of 20–2000 characters and a valid category.',400)
      const sources=Array.isArray(input.sources)?input.sources:[]
      if(sources.length>3||sources.some(source=>!source||typeof source.label!=='string'||source.label.length>100||typeof source.href!=='string'||source.href.length>300||!(/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(source.href))))return fail('Use up to three HTTPS or site-relative source links.',400)
      if(input.publish===true&&!sources.length)return fail('Add at least one source before publishing a reusable answer.',400)
      const row=await db!.from('contact_messages').select('message').eq('id',input.id).eq('subject','QA:pending').maybeSingle()
      const ticket=row.data&&parseTicket(row.data.message)
      if(row.error)return fail('Could not read the question.',503)
      if(!ticket)return fail('This question is no longer pending. Reload the queue.',409)
      const next:QuestionTicket={...ticket,answer:input.answer.trim(),category:input.category as QuestionTicket['category'],sources,status:'answered',published:input.publish===true,answeredAt:new Date().toISOString()}
      const saved=await db!.from('contact_messages').update({subject:next.published?'QA:published':'QA:answered',message:JSON.stringify(next)}).eq('id',input.id).eq('subject','QA:pending').select('id')
      if(saved.error)return fail('Could not save the answer. Please retry.',503)
      if(!saved.data?.length)return fail('Another reviewer already answered this question. Reload the queue.',409)
      return NextResponse.json({answered:true,published:next.published})
    }
    if(!['ask','escalate'].includes(String(input.action)))return fail('Unknown question action.',400)
    if(typeof input.question!=='string'||input.question.trim().length<10||input.question.trim().length>1000)return fail('Enter a question of 10–1000 characters.',400)
    const question=input.question.trim(),now=Date.now(),ip=request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown'
    for(const [key,value]of attempts)if(value.until<=now)attempts.delete(key)
    const prior=attempts.get(ip)
    if((prior?.count||0)>=30||attempts.size>=10000)return fail('Please wait a few minutes before asking more questions.',429)
    attempts.set(ip,{count:(prior?.count||0)+1,until:prior?.until||now+600000})
    const kb=await getQuestionCatalog(db),route=routeQuestion(question,kb.items)
    if(!route.needsReview&&input.action!=='escalate')return NextResponse.json({...route,queued:false})
    if(!user||!user.email_confirmed_at||!user.email)return NextResponse.json({...route,queued:false,signInRequired:true})
    if(!db||!kb.available)return fail('The review queue is unavailable. Your question has not been submitted. Please try again later.',503)
    const hash=createHash('sha256').update(`${user.id}:${normalizeQuestion(question)}`).digest('hex')
    const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`
    const existing=await db.from('contact_messages').select('id,message').eq('id',id).maybeSingle()
    if(existing.error)return fail('Could not check previous submissions.',503)
    if(existing.data){const ticket=parseTicket(existing.data.message);return NextResponse.json({...route,queued:ticket?.status==='pending',duplicate:true,ticketId:id,previousAnswer:ticket?.answer||null})}
    const count=await db.from('contact_messages').select('id',{count:'exact',head:true}).eq('email',user.email).like('subject','QA:%').gte('created_at',new Date(now-86400000).toISOString())
    if(count.error)return fail('Could not check your submission limit.',503)
    if((count.count||0)>=10)return fail('You can submit up to ten new questions for review per day.',429)
    const ticket:QuestionTicket={question,category:route.category,ownerId:user.id,status:'pending'}
    const saved=await db.from('contact_messages').insert({id,name:'Q&A member',email:user.email,subject:'QA:pending',message:JSON.stringify(ticket)})
    if(saved.error&&saved.error.code!=='23505')return fail('Your question could not be saved. Please retry.',503)
    return NextResponse.json({...route,queued:true,ticketId:id,duplicate:saved.error?.code==='23505'})
  }catch{return fail('Question service is temporarily unavailable. Please try again.',503)}
}
