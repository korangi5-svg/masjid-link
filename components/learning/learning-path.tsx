'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check, Lock, ArrowRight, BookOpen } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { newMuslimModules, parsePathProgress, type PathProgress } from '@/lib/learning-path'
import { getSupabase } from '@/lib/supabase'
import { primaryButton, secondaryButton } from '@/lib/site'

async function pathRequest(method: 'GET' | 'POST', userId: string, body?: { moduleId: string; answer: number }) {
  const db = getSupabase()
  const session = await db?.auth.getSession()
  if (!session?.data.session || session.data.session.user.id !== userId) throw new Error('Your session changed. Please log in again.')
  const response = await fetch('/api/learning-path', { method, headers: { Authorization: `Bearer ${session.data.session.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Could not save your progress.')
  return parsePathProgress(result)
}

export function LearningPath() {
  const { user, loading } = useAuth()
  const activeUser = useRef(user?.id); activeUser.current = user?.id
  const [progress, setProgress] = useState<PathProgress>({ completed: [] })
  const [selected, setSelected] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [reading, setReading] = useState(true)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const lessonHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    let cancelled = false
    const id = user?.id
    setProgress({ completed: [] }); setSelected(0); setAnswer(null); setError(''); setNotice(''); setBusy(false); busyRef.current = false
    if (!id) { setReading(false); return }
    setReading(true)
    pathRequest('GET', id).then(next => {
      if (!cancelled) { setProgress(next); setSelected(Math.min(next.completed.length, newMuslimModules.length - 1)) }
    }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load progress.') })
      .finally(() => { if (!cancelled) setReading(false) })
    return () => { cancelled = true }
  }, [user?.id, retry])
  const module = newMuslimModules[selected]
  const complete = progress.completed.includes(module.id)
  const finished = progress.completed.length === newMuslimModules.length
  async function submit() {
    if (!user || answer === null || busyRef.current || reading) return
    const id = user.id
    busyRef.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const next = await pathRequest('POST', id, { moduleId: module.id, answer })
      if (activeUser.current !== id) return
      setProgress(next); setAnswer(null)
      if (next.completed.length === newMuslimModules.length) setNotice('You completed the New Muslim Path. Revisit any module whenever you like.')
      else { setSelected(next.completed.length); setNotice(`${module.title} completed. ${newMuslimModules[next.completed.length].title} is now unlocked.`) }
      requestAnimationFrame(() => lessonHeading.current?.focus())
    } catch (e) { if (activeUser.current === id) setError(e instanceof Error ? e.message : 'Could not save completion.') }
    finally { if (activeUser.current === id) { busyRef.current = false; setBusy(false) } }
  }
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <section className="rounded-3xl bg-navy p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-mint">Step by step · Learning paths</p><h1 className="mt-3 text-4xl font-extrabold">New Muslim Path</h1><p className="mt-4 max-w-2xl text-white/80">Build a foundation at your own pace. Complete one module and its knowledge check to unlock the next.</p><p className="mt-4 text-sm text-mint">4 modules · About 22 minutes · Beginner friendly</p></section>
    <div className="my-6 flex flex-wrap gap-3"><Link href="/daily-learning" className={secondaryButton}>Daily learning</Link><Link href="/dashboard" className={secondaryButton}>My dashboard</Link></div>
    {loading || reading ? <p role="status" className="py-12">Loading your learning path…</p> : <>
      {!user && <div className="mb-6 rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-bold text-navy">Start with Shahadah</h2><p className="my-3">You can preview the first module below. Log in to complete checks, save progress across devices, and unlock the path.</p><Link href="/login" className={primaryButton}>Log in to save progress</Link></div>}
      <section className="mb-8 rounded-2xl border border-border p-6" aria-label="Path progress"><div className="flex justify-between gap-4"><h2 className="font-bold text-navy">{finished ? 'Path completed' : 'Your progress'}</h2><span>{progress.completed.length} of 4 modules completed</span></div><progress value={progress.completed.length} max={4} aria-label="Completed modules" className="mt-4 h-3 w-full accent-teal"/><p className="mt-2 text-sm text-muted-foreground">{finished ? 'Keep practicing and revisit any lesson.' : `Next step: ${newMuslimModules[progress.completed.length].title}`}</p></section>
      {notice && <p role="status" className="mb-6 rounded-xl bg-surface p-4 font-semibold text-teal-dark">{notice}</p>}
      {error && <div role="alert" className="mb-6 rounded-xl border border-destructive p-4"><p className="text-destructive">{error}</p><button className={`${secondaryButton} mt-3`} disabled={busy} onClick={() => setRetry(value => value + 1)}>Reload saved progress</button></div>}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <nav aria-label="New Muslim modules"><ol className="space-y-3">{newMuslimModules.map((item, index) => {
          const done = progress.completed.includes(item.id), locked = index > progress.completed.length
          const Icon = done ? Check : locked ? Lock : BookOpen
          return <li key={item.id}><button disabled={locked || busy} aria-current={selected === index ? 'step' : undefined} onClick={() => { setSelected(index); setAnswer(null); setError(''); setNotice(''); requestAnimationFrame(() => lessonHeading.current?.focus()) }} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${selected === index ? 'border-teal bg-surface' : 'border-border'} ${locked ? 'text-muted-foreground' : 'text-navy'}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface"><Icon size={18} aria-hidden="true"/></span><span><span className="block text-xs uppercase">Module {index + 1} · {done ? 'Completed' : locked ? 'Locked' : 'Available'}</span><span className="mt-1 block font-bold">{item.title}</span></span></button></li>
        })}</ol><p className="mt-4 text-xs text-muted-foreground">Locked modules open automatically after the previous knowledge check is completed.</p></nav>
        <article className="rounded-2xl border border-border p-6 sm:p-8" aria-labelledby="module-heading"><p className="text-sm font-semibold uppercase text-teal-dark">Module {selected + 1} · {module.minutes} minute lesson</p><h2 id="module-heading" ref={lessonHeading} tabIndex={-1} className="mt-3 text-3xl font-bold text-navy outline-none">{module.title}</h2><p className="mt-2 text-lg text-muted-foreground">{module.subtitle}</p><p className="mt-6 text-lg leading-relaxed">{module.overview}</p><div className="mt-6 space-y-4 leading-relaxed">{module.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
          <section className="mt-7 rounded-xl bg-surface p-5"><h3 className="font-bold text-navy">Put it into practice</h3><p className="mt-3">{module.practice}</p></section>
          <section className="mt-7"><h3 className="font-bold text-navy">Read the sources</h3><ul className="mt-3 space-y-2">{module.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-dark underline">{source.label} ↗</a></li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Lesson explanations are editorial summaries, separate from scripture. This introductory path supports learning with a trusted teacher.</p></section>
          {complete ? <section className="mt-8 rounded-xl bg-surface p-5"><h3 className="font-bold text-teal-dark">Module completed</h3><p className="mt-2">{module.explanation}</p>{selected + 1 < newMuslimModules.length && <button className={`${primaryButton} mt-4`} onClick={() => { setSelected(selected + 1); setAnswer(null); requestAnimationFrame(() => lessonHeading.current?.focus()) }}>Continue to {newMuslimModules[selected + 1].title}<ArrowRight className="ml-2 size-4"/></button>}</section> : <form className="mt-8 border-t border-border pt-7" onSubmit={e => { e.preventDefault(); void submit() }}><fieldset disabled={!user || busy}><legend className="text-xl font-bold text-navy">Quick knowledge check</legend><p className="my-4">{module.question}</p><div className="space-y-3">{module.options.map((option,index) => <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${answer === index ? 'border-teal bg-surface' : 'border-border'}`}><input type="radio" name={`answer-${module.id}`} value={index} checked={answer === index} onChange={() => { setAnswer(index); setError('') }} className="mt-1 accent-teal"/><span>{option}</span></label>)}</div><button type="submit" disabled={answer === null || busy || !user} className={`${primaryButton} mt-5`}>{busy ? 'Saving progress…' : selected === 3 ? 'Complete the path' : 'Complete module & unlock next'}</button></fieldset></form>}
        </article>
      </div>
    </>}
  </div>
}

export function LearningPathLink() {
  return <section className="my-6 rounded-2xl border border-border bg-surface p-6"><p className="text-sm font-semibold text-teal-dark">A guided foundation</p><h2 className="mt-2 text-2xl font-bold text-navy">New Muslim Path</h2><p className="my-3">Shahadah → Salah → Wudu → Quran Basics. Save your progress and unlock each next step.</p><Link href="/learning-path" className={secondaryButton}>Open learning path</Link></section>
}
