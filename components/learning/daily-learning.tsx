'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { dailyLesson, dailyPreferences } from '@/lib/daily-learning'
import { getSupabase } from '@/lib/supabase'
import { primaryButton, secondaryButton } from '@/lib/site'

export function DailyLearning({ emailReady }: { emailReady: boolean }) {
  const { user, loading } = useAuth()
  const [now, setNow] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<{ userId: string; prefs: ReturnType<typeof dailyPreferences> } | null>(null)
  const activeUser = useRef(user?.id); activeUser.current = user?.id
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
  useEffect(() => { setSaved(null); setNotice(''); setError(''); setBusy(false) }, [user?.id])
  const prefs = saved?.userId === user?.id && saved ? saved.prefs : dailyPreferences(user?.user_metadata?.daily_learning)
  async function save(change: Partial<ReturnType<typeof dailyPreferences>>) {
    if (!user || busy) return
    const id = user.id
    setBusy(true); setNotice(''); setError('')
    try {
      const db = getSupabase()
      if (!db) throw new Error('Please log in again to save preferences.')
      const fresh = await db.auth.getUser()
      if (fresh.error || fresh.data.user?.id !== id) throw new Error('Your session changed. Please log in again.')
      const next = { ...dailyPreferences(fresh.data.user.user_metadata?.daily_learning), ...change }
      const result = await db.auth.updateUser({ data: { daily_learning: next } })
      if (result.error) throw new Error('Could not save preferences. Please try again.')
      if (activeUser.current === id) { setSaved({ userId: id, prefs: next }); setNotice('Daily learning preferences saved.') }
    } catch (e) { if (activeUser.current === id) setError(e instanceof Error ? e.message : 'Could not save preferences.') }
    finally { if (activeUser.current === id) setBusy(false) }
  }
  if (now === null || loading) return <p role="status" className="mx-auto max-w-4xl px-4 py-12">Preparing today’s learning…</p>
  const lesson = dailyLesson(user?.user_metadata?.interests, now)
  return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
    <section className="rounded-3xl bg-navy p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-widest text-mint">A little learning, every day · {lesson.date}</p><h1 className="mt-3 text-4xl font-extrabold">Daily Islamic Learning</h1><p className="mt-4 text-xl">{lesson.title}</p><p className="mt-3 text-white/80">Quran, hadith, dua, reflection, and one practical step. About five minutes.</p><p className="mt-3 text-sm text-mint">{lesson.reason}</p></section>
    <div className="my-6 flex flex-wrap gap-3"><Link href="/dashboard" className={secondaryButton}>My dashboard</Link><Link href="/learn" className={secondaryButton}>Learning library</Link></div>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-border bg-surface p-6 md:col-span-2"><h2 className="text-2xl font-bold text-navy">01 · Quran verse</h2><p lang="ar" dir="rtl" className="mt-6 text-3xl leading-loose">{lesson.verse.arabic}</p><p className="mt-5 text-lg">{lesson.verse.meaning}</p><a href={lesson.verse.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-teal-dark underline">{lesson.verse.reference} · Read in context ↗</a><p className="mt-4 text-sm text-muted-foreground">{lesson.verse.context}</p><p className="mt-2 text-xs text-muted-foreground">{lesson.verse.reference === 'Ash-Sharh 94:5' ? 'Translation: Dr. Mustafa Khattab, The Clear Quran.' : 'Editorial summary of the meaning; see the source for full translations.'}</p></section>
      <section className="rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">02 · Hadith</h2><p className="mt-4 leading-relaxed">{lesson.hadith.meaning}</p><a href={lesson.hadith.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-teal-dark underline">{lesson.hadith.reference} ↗</a><p className="mt-3 text-xs text-muted-foreground">A summary of the meaning; the full narration is linked above.</p></section>
      <section className="rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">03 · Dua</h2><p lang="ar" dir="rtl" className="mt-5 text-3xl leading-loose">{lesson.dua.arabic}</p><p className="mt-3 italic">{lesson.dua.transliteration}</p><p className="mt-3">{lesson.dua.meaning}</p><a href={lesson.dua.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-teal-dark underline">{lesson.dua.reference} ↗</a><p className="mt-3 text-sm text-muted-foreground">{lesson.dua.use}</p></section>
      <section className="rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">04 · Reflection</h2><p className="mt-4 text-xl leading-relaxed">{lesson.reflection}</p><p className="mt-4 text-sm text-muted-foreground">Take a quiet moment. Your answer can stay with you.</p></section>
      <section className="rounded-2xl bg-surface p-6"><h2 className="text-2xl font-bold text-navy">05 · Short lesson</h2><p className="mt-4 leading-relaxed">{lesson.lesson}</p><p className="mt-5 font-semibold text-teal-dark">Today’s action: {lesson.action}</p></section>
    </div>
    <section className="mt-8 rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">Make room for a daily reminder</h2>{!user ? <><p className="my-4">Read today’s lesson freely. Log in to personalize your practice and save delivery preferences.</p><Link href="/login" className={primaryButton}>Log in</Link></> : <><label className="mt-5 flex items-center gap-3"><input type="checkbox" checked={prefs.inApp} disabled={busy} onChange={e => save({ inApp: e.target.checked })}/>Show a daily reminder on my dashboard and notifications page</label><label className="mt-4 flex items-center gap-3"><input type="checkbox" checked={prefs.email} disabled={busy || (!emailReady && !prefs.email) || (!user.email_confirmed_at && !prefs.email)} onChange={e => save({ email: e.target.checked })}/>Email my daily lesson to {user.email}</label><p className="mt-3 text-sm text-muted-foreground">Email schedule: 13:00 UTC daily (8 a.m. Toronto standard time; 9 a.m. daylight time). You can turn it off here at any time.</p>{!emailReady && <p role="status" className="mt-3 text-sm text-muted-foreground">Email delivery is awaiting a verified sender and server configuration. Lessons and in-app reminders are available now.</p>}{!user.email_confirmed_at && <p className="mt-3 text-sm text-muted-foreground">Verify your account email to enable daily delivery.</p>}<button className={`${secondaryButton} mt-5`} disabled={busy || prefs.readDate === lesson.date} onClick={() => save({ readDate: lesson.date })}>{prefs.readDate === lesson.date ? 'Today’s lesson completed' : 'Mark today’s lesson complete'}</button></>}{error && <p role="alert" className="mt-3 text-destructive">{error}</p>}{notice && <p role="status" className="mt-3 text-teal-dark">{notice}</p>}</section>
    <p className="mt-6 text-sm text-muted-foreground">A seven-day starter cycle revisits these sourced texts for practice. Reflections and lessons are editorial prompts, separate from scripture. Dates change at midnight in Toronto. In-app reminders appear when you visit; they are not background push notifications.</p>
  </main>
}

export function DailyLearningReminder() {
  const { user } = useAuth()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
  if (!user || now === null) return null
  const prefs = dailyPreferences(user.user_metadata?.daily_learning)
  const lesson = dailyLesson(user.user_metadata?.interests, now)
  if (!prefs.inApp || prefs.readDate === lesson.date) return null
  return <aside className="my-6 rounded-2xl border border-teal bg-surface p-6" aria-label="Daily learning reminder"><p className="text-sm font-semibold text-teal-dark">Today’s learning is ready · {lesson.date}</p><h2 className="mt-2 text-2xl font-bold text-navy">{lesson.title}</h2><p className="my-3">One verse, one hadith, one dua, and a moment to reflect.</p><Link href="/daily-learning" className={primaryButton}>Read today’s lesson</Link></aside>
}
