'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

type Mode = 'local' | 'question'
type Result = { message: string; links?: { label: string; href: string }[]; details?: string[] }

export function Assistant() {
  const [mode, setMode] = useState<Mode>('local')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function switchMode(next: Mode) {
    if (mode === next) return
    setMode(next)
    setText('')
    setResult(null)
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setResult(null)
    try {
      const session = mode === 'question' ? await getSupabase()?.auth.getSession() : null
      const token = session?.data.session?.access_token
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ mode, text }),
        signal: AbortSignal.timeout(30000),
      })
      setResult(await response.json())
    } catch {
      setResult({ message: 'The assistant couldn’t connect. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const local = mode === 'local'
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div role="group" aria-label="What can we help with?" className="flex flex-wrap gap-2">
        <button type="button" className={local ? primaryButton : secondaryButton} aria-pressed={local} disabled={busy} onClick={() => switchMode('local')}>Masjids & prayer times</button>
        <button type="button" className={local ? secondaryButton : primaryButton} aria-pressed={!local} disabled={busy} onClick={() => switchMode('question')}>Ask a question</button>
      </div>
      <form onSubmit={ask} className="mt-5 rounded-2xl border border-border p-5 sm:p-6">
        <label htmlFor="assistant-input" className="mb-2 block font-semibold text-navy">
          {local ? 'City or postal code' : 'Question about Islam or Connect to Masjid'}
        </label>
        <input id="assistant-input" className={inputClass} value={text} onChange={event => setText(event.target.value)}
          placeholder={local ? 'Toronto, Ontario' : 'What is wudu?'} maxLength={local ? 100 : 500} required />
        {!local && <p className="mt-2 text-sm text-muted-foreground">Signed-in members can use AI to match questions to published answers and site pages. Please leave out private information.</p>}
        <button type="submit" className={`${primaryButton} mt-4`} disabled={busy || !text.trim()}>
          {busy ? 'Looking up your request…' : local ? 'Find masjids and times' : 'Find an answer'}
        </button>
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {result && (
          <section aria-label="Assistant result" className="mt-5 rounded-2xl bg-surface p-5 sm:p-6">
            <p className="leading-relaxed text-navy">{result.message}</p>
            {Boolean(result.details?.length) && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {result.details?.map(item => <li key={item} className="rounded-full bg-white px-3 py-1 text-sm text-navy">{item}</li>)}
              </ul>
            )}
            {Boolean(result.links?.length) && (
              <ul className="mt-4 space-y-2">
                {result.links?.map(({ href, label }) => (
                  <li key={href + label}><Link href={href} className="font-medium text-teal-dark underline underline-offset-4">{label}</Link></li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
