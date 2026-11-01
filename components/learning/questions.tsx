'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'
import { questionCategories, type KnowledgeAnswer, type QuestionTicket, type QuestionCategory } from '@/lib/questions'

type Ticket=QuestionTicket&{id:string;createdAt:string}
type Result={category:QuestionCategory;needsReview:boolean;suggestions:(KnowledgeAnswer&{strong:boolean})[];queued:boolean;duplicate?:boolean;signInRequired?:boolean;previousAnswer?:string}
async function questionRequest(method:'GET'|'POST',body?:unknown,review=false) {
  const session=await getSupabase()?.auth.getSession()
  const token=session?.data.session?.access_token
  const response=await fetch(`/api/questions${review?'?review=1':''}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'})
  const data=await response.json()
  if(!response.ok)throw new Error(data.error||'Question service is unavailable.')
  return data
}
export function Questions({review=false}:{review?:boolean}) {
  const {user,loading}=useAuth()
  const identity=useRef(user?.id);identity.current=user?.id
  const [question,setQuestion]=useState(''),[submitted,setSubmitted]=useState(''),[result,setResult]=useState<Result|null>(null)
  const [answers,setAnswers]=useState<KnowledgeAnswer[]>([]),[tickets,setTickets]=useState<Ticket[]>([])
  const [canReview,setCanReview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[refresh,setRefresh]=useState(0),[ready,setReady]=useState(false)
  const busyRef=useRef(false)
  const [reply,setReply]=useState(''),[category,setCategory]=useState<QuestionCategory>('General'),[source,setSource]=useState(''),[publish,setPublish]=useState(false),[selected,setSelected]=useState('')
  useEffect(()=>{
    let cancelled=false
    setReady(false);setResult(null);setError('');setTickets([]);setAnswers([]);setCanReview(false);setSelected('');setReply('');setNotice('');setBusy(false);busyRef.current=false
    if(loading)return
    questionRequest('GET',undefined,review).then(data=>{if(!cancelled){setAnswers(data.answers||[]);setTickets(data.tickets||[]);setCanReview(data.reviewer===true)}}).catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setReady(true)})
    return()=>{cancelled=true}
  },[user?.id,loading,review,refresh])
  async function ask(escalate=false) {
    if(busyRef.current)return
    busyRef.current=true;setBusy(true);setError('');setNotice('')
    const id=user?.id,text=escalate?submitted:question.trim()
    try {
      const data:Result=await questionRequest('POST',{action:escalate?'escalate':'ask',question:text})
      if(identity.current!==id)return
      setResult(data);setSubmitted(text)
      if(data.queued||data.previousAnswer){const history=await questionRequest('GET');if(identity.current===id)setTickets(history.tickets||[])}
    }catch(e){if(identity.current===id)setError(e instanceof Error?e.message:'Could not submit your question.')}
    finally{if(identity.current===id){busyRef.current=false;setBusy(false)}}
  }
  async function answerTicket() {
    if(busyRef.current)return
    const id=user?.id
    busyRef.current=true;setBusy(true);setError('')
    try {
      const response=await questionRequest('POST',{action:'answer',id:selected,answer:reply,category,publish,sources:source.trim()?[{label:'Reviewer source',href:source.trim()}]:[]})
      if(identity.current!==id)return
      setTickets(previous=>previous.filter(ticket=>ticket.id!==selected));setSelected('');setReply('');setSource('');setPublish(false)
      setNotice(response.published?'Answer saved and added to the searchable knowledge base.':'Reply saved. The member can read it in My questions.')
    }catch(e){if(identity.current===id)setError(e instanceof Error?e.message:'Could not save reply.')}
    finally{if(identity.current===id){busyRef.current=false;setBusy(false)}}
  }
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><section className="rounded-3xl bg-navy p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-mint">Ask · Discover · Learn</p><h1 className="mt-3 text-4xl font-extrabold">{review?'Question review queue':'Questions & answers'}</h1><p className="mt-4 max-w-2xl text-white/80">{review?'Answer unresolved questions and turn useful replies into reusable knowledge.':'Find existing answers first. Questions that need more help are tagged and routed for human review.'}</p></section>
    <div className="my-6 flex flex-wrap gap-3"><Link href={review?'/questions':'/learning-path'} className={secondaryButton}>{review?'Back to questions':'New Muslim Path'}</Link><Link href="/daily-learning" className={secondaryButton}>Daily learning</Link>{canReview&&<Link href="/questions/review" className={secondaryButton}>Review unanswered questions</Link>}</div>
    {error&&<div role="alert" className="my-5 rounded-xl border border-destructive p-4"><p className="text-destructive">{error}</p><button className={`${secondaryButton} mt-3`} onClick={()=>setRefresh(n=>n+1)} disabled={busy}>Reload questions</button></div>}
    {notice&&<p role="status" className="my-5 rounded-xl bg-surface p-4 text-teal-dark">{notice}</p>}
    {!ready?<p role="status">Loading questions…</p>:review?<>
      {!error&&<p className="my-5 text-muted-foreground">{tickets.length} pending {tickets.length===1?'question':'questions'} shown · oldest first · up to 100 per view.</p>}
      <div className="grid gap-6 lg:grid-cols-2"><section aria-label="Pending questions"><ul className="space-y-3">{tickets.map(ticket=><li key={ticket.id}><button disabled={busy} onClick={()=>{setSelected(ticket.id);setReply('');setCategory(ticket.category);setSource('');setPublish(false);setError('');setNotice('')}} className={`w-full rounded-2xl border p-5 text-left ${selected===ticket.id?'border-teal bg-surface':'border-border'}`}><span className="text-xs font-semibold uppercase text-teal-dark">{ticket.category} · Pending review</span><p className="mt-3 font-bold text-navy">{ticket.question}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</p></button></li>)}</ul>{!tickets.length&&!error&&<p className="rounded-2xl border border-border p-6">No unanswered questions in the queue.</p>}</section>
      {selected&&<form onSubmit={e=>{e.preventDefault();void answerTicket()}} className="rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">Write a reviewed answer</h2><label htmlFor="review-category" className="mt-5 block font-semibold">Topic category</label><select id="review-category" value={category} onChange={e=>setCategory(e.target.value as QuestionCategory)} className={`${inputClass} mt-2`} disabled={busy}>{questionCategories.map(value=><option key={value}>{value}</option>)}</select><label htmlFor="review-answer" className="mt-5 block font-semibold">Reply</label><textarea id="review-answer" required minLength={20} maxLength={2000} rows={8} value={reply} onChange={e=>setReply(e.target.value)} className={`${inputClass} mt-2`} disabled={busy}/><label htmlFor="review-source" className="mt-5 block font-semibold">Source URL</label><input id="review-source" value={source} maxLength={300} onChange={e=>setSource(e.target.value)} placeholder="https://… or /learning-path" className={`${inputClass} mt-2`} disabled={busy}/><label className="mt-5 flex items-start gap-3"><input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} disabled={busy} className="mt-1 accent-teal"/><span>Publish this question and answer for other users. Remove personal details first. A source is required.</span></label><p className="mt-3 text-sm text-muted-foreground">Private replies appear only in the member’s question history. No email is sent by this queue.</p><button disabled={busy} className={`${primaryButton} mt-5`}>{busy?'Saving answer…':'Save reviewed answer'}</button></form>}</div>
    </>:<>
      <form onSubmit={e=>{e.preventDefault();void ask()}} className="rounded-2xl border border-border p-6"><label htmlFor="qa-question" className="block text-xl font-bold text-navy">What would you like to understand?</label><textarea id="qa-question" required minLength={10} maxLength={1000} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="For example: How do I perform wudu?" className={`${inputClass} mt-4`} disabled={busy}/><p className="mt-3 text-sm text-muted-foreground">Keep personal details out of your question. Search uses topic and wording matches to published answers; it does not generate religious rulings.</p><button disabled={busy||question.trim().length<10} className={`${primaryButton} mt-5`}>{busy?'Searching and routing…':'Find answers'}</button></form>
      {result&&<section className="my-7" aria-live="polite"><p className="text-sm font-semibold text-teal-dark">Topic: {result.category}</p><h2 className="mt-2 text-2xl font-bold text-navy">{result.needsReview?'This question may need a reviewer':'Existing answers you may find helpful'}</h2>{result.queued&&<p className="mt-4 rounded-xl bg-surface p-4">{result.duplicate?'This question is already in your review queue.':'Your question was saved to the human review queue.'} Check My questions below for a reply. No response time is promised.</p>}{result.signInRequired&&<p className="mt-4">Log in with a verified account to submit this question for review. <Link href="/login" className="text-teal-dark underline">Log in</Link></p>}{result.previousAnswer&&<div className="mt-4 rounded-xl bg-surface p-5"><h3 className="font-bold">A reviewer already answered this question</h3><p className="mt-3 whitespace-pre-wrap">{result.previousAnswer}</p></div>}<ul className="mt-5 space-y-4">{result.suggestions.map(answer=><li key={answer.id}><AnswerCard answer={answer} related={!answer.strong}/></li>)}</ul>{!result.queued&&!result.signInRequired&&!result.previousAnswer&&<button disabled={busy} onClick={()=>void ask(true)} className={`${secondaryButton} mt-5`}>These answers did not help — request review</button>}</section>}
      {user&&<section className="my-9"><h2 className="text-2xl font-bold text-navy">My questions</h2><p className="mt-2 text-sm text-muted-foreground">Your latest 50 submissions. Replies appear here; refresh to check for updates.</p><button className={`${secondaryButton} mt-3`} onClick={()=>setRefresh(n=>n+1)} disabled={busy}>Refresh replies</button><ul className="mt-5 space-y-4">{tickets.map(ticket=><li key={ticket.id} className="rounded-2xl border border-border p-5"><p className="text-xs font-semibold uppercase text-teal-dark">{ticket.category} · {ticket.status==='answered'?'Answered':'Pending review'}</p><h3 className="mt-3 font-bold text-navy">{ticket.question}</h3>{ticket.answer&&<p className="mt-3 whitespace-pre-wrap">{ticket.answer}</p>}{ticket.sources?.map(source=><a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="mt-3 block text-sm text-teal-dark underline">{source.label} ↗</a>)}</li>)}</ul>{!tickets.length&&<p className="mt-4 text-muted-foreground">You haven’t submitted a question for review yet.</p>}</section>}
      <section className="mt-10"><h2 className="text-2xl font-bold text-navy">Browse the knowledge base</h2><p className="mt-2 text-muted-foreground">Starter answers and published reviewer replies. Personal circumstances may need qualified guidance.</p><ul className="mt-5 grid gap-5 md:grid-cols-2">{answers.map(answer=><li key={answer.id}><AnswerCard answer={answer}/></li>)}</ul></section>
    </>}
  </div>
}
function AnswerCard({answer,related=false}:{answer:KnowledgeAnswer;related?:boolean}) {return <article className="h-full rounded-2xl border border-border p-6"><p className="text-xs font-semibold uppercase text-teal-dark">{answer.category}{related?' · Related reading':''}</p><h3 className="mt-3 text-xl font-bold text-navy">{answer.question}</h3><p className="mt-4 whitespace-pre-wrap leading-relaxed">{answer.answer}</p><ul className="mt-4 space-y-2">{answer.sources.map(source=><li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-dark underline">{source.label} ↗</a></li>)}</ul></article>}
export function QuestionsLink() {return <section className="my-6 rounded-2xl border border-border p-6"><p className="text-sm font-semibold text-teal-dark">Find an answer before asking again</p><h2 className="mt-2 text-2xl font-bold text-navy">Questions & answers</h2><p className="my-3">Search sourced answers, explore topics, or send an unanswered question for review.</p><Link href="/questions" className={secondaryButton}>Ask a question</Link></section>}
