'use client'

import Link from 'next/link'
import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

type Mode = 'local' | 'question'
type Result = { message: string; links?: { label: string; href: string }[]; details?: string[] }

type Recognition = {
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

export function Assistant() {
  const [mode, setMode] = useState<Mode>('local')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const recognitionRef = useRef<Recognition | null>(null)
  const voiceRequest = useRef(0)
  const [listening, setListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')

  useEffect(() => () => {
    voiceRequest.current += 1
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
  }, [])

  async function toggleVoice() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const browser = window as SpeechWindow
    const SpeechRecognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('Voice input is unavailable in this browser. You can type your question.')
      return
    }

    if (listening) return
    const request = ++voiceRequest.current
    setListening(true)
    setVoiceStatus('Checking microphone access…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      if (request !== voiceRequest.current) return
      setListening(false)
      const denied = error instanceof DOMException && error.name === 'NotAllowedError'
      setVoiceStatus(denied
        ? 'Microphone access was denied. Allow it for this site in your browser settings and try again.'
        : 'The browser couldn’t open your microphone. Check that it is connected and available.')
      return
    }

    if (request !== voiceRequest.current) return
    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-CA'
      recognition.onresult = event => {
        if (recognitionRef.current !== recognition) return
        const transcript = Array.from(event.results, result => result[0]?.transcript ?? '').join(' ').trim()
        if (!transcript) return
        setText(current => [current.trim(), transcript].filter(Boolean).join(' ').slice(0, 500))
        setVoiceStatus('Review or edit your question before submitting.')
      }
      recognition.onerror = event => {
        if (recognitionRef.current !== recognition) return
        if (['not-allowed', 'service-not-allowed', 'network'].includes(event.error)) {
          setVoiceStatus('Microphone access is allowed, but your browser’s speech service is unavailable. On Windows, select the question box and press Windows + H to dictate.')
        } else {
          setVoiceStatus('Voice input couldn’t capture your question. Try again or type it.')
        }
      }
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return
        recognitionRef.current = null
        setListening(false)
        setVoiceStatus(status => status === 'Listening…' ? 'No speech was captured. Try again or type your question.' : status)
      }
      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
      setVoiceStatus('Listening…')
    } catch {
      recognitionRef.current = null
      setListening(false)
      setVoiceStatus('Voice input couldn’t start. You can type your question.')
    }
  }

  function switchMode(next: Mode) {
    if (mode === next) return
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
    setListening(false)
    setVoiceStatus('')
    setMode(next)
    setText('')
    setResult(null)
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim() || busy || listening) return
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
        <div className="flex items-center gap-2">
          <input id="assistant-input" className={inputClass} value={text} onChange={event => setText(event.target.value)}
            placeholder={local ? 'Toronto, Ontario' : 'What is wudu?'} maxLength={local ? 100 : 500} required />
          {!local && (
            <button type="button" className={`${secondaryButton} shrink-0 px-3 py-2`} onClick={toggleVoice}
              disabled={busy} aria-label={listening ? 'Stop voice input' : 'Speak your question'}>
              {listening ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {listening ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>
        {!local && <p role="status" className="mt-2 text-sm text-muted-foreground">{voiceStatus}</p>}
        {!local && <p className="mt-2 text-sm text-muted-foreground">Signed-in members can use AI to match questions to published answers and site pages. Please leave out private information.</p>}
        <button type="submit" className={`${primaryButton} mt-4`} disabled={busy || listening || !text.trim()}>
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
