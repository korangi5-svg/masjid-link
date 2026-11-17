'use client'

import Link from 'next/link'
import { Mic, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

import { locales, scriptLanguage, unavailable, type Language } from '@/lib/assistant-language'
import type { AssistantContext } from '@/lib/services/assistant-ai'

type Mode = 'local' | 'question'
type Result = { message: string; language?: Language; context?: AssistantContext; links?: { label: string; href: string }[]; details?: string[] }

type BrowserRecognition = {
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function recognitionConstructor() {
  const browser = window as Window & {
    SpeechRecognition?: new () => BrowserRecognition
    webkitSpeechRecognition?: new () => BrowserRecognition
  }
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition
}

export function Assistant() {
  const [mode, setMode] = useState<Mode>('local')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const playback = useRef<{ cancel: () => void } | null>(null)
  const [reading, setReading] = useState(false)
  const [audioStatus, setAudioStatus] = useState('')

  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null)
  const context = useRef<AssistantContext | undefined>(undefined)
  const language = useRef<Language | undefined>(undefined)
  const [capturing, setCapturing] = useState(false)
  const voiceRequest = useRef(0)
  const [listening, setListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')

  useEffect(() => () => {
    voiceRequest.current += 1
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
    if (playback.current) {
      const active = playback.current
      playback.current = null
      active.cancel()
    }
  }, [])

  function stopReading() {
    if (playback.current) {
      const active = playback.current
      playback.current = null
      active.cancel()
    }
    setReading(false)
    setAudioStatus('')
  }

  function toggleReading(answer: Result) {
    if (playback.current) return stopReading()

    const lang = answer.language ?? 'en'
    const synthesis = window.speechSynthesis
    if (!synthesis || typeof SpeechSynthesisUtterance !== 'function') {
      setAudioStatus(unavailable[lang])
      return
    }

    const spoken = [answer.message, ...(answer.details ?? [])].join(' ').slice(0, 2500)
    const speech = new SpeechSynthesisUtterance(spoken)
    const voices = synthesis.getVoices()
    const voice = voices.find(voice => voice.lang.toLowerCase() === locales[lang].toLowerCase())
      ?? voices.find(voice => voice.lang.toLowerCase().split('-')[0] === lang)
    speech.lang = voice?.lang ?? locales[lang]
    if (voice) speech.voice = voice

    const active = { cancel: () => synthesis.cancel() }
    playback.current = active
    setReading(true)
    setAudioStatus('')
    speech.onend = () => { if (playback.current === active) stopReading() }
    const failed = () => {
      if (playback.current !== active) return
      stopReading()
      setAudioStatus(unavailable[lang])
    }
    speech.onerror = failed
    try {
      synthesis.speak(speech)
    } catch {
      failed()
    }
  }

  function toggleVoice() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const Recognition = recognitionConstructor()
    if (!Recognition) {
      setVoiceStatus('This browser doesn’t support dictation. You can type your question or use your device’s dictation.')
      return
    }

    stopReading()
    const request = ++voiceRequest.current
    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-CA'
    let transcript = ''
    let timer: ReturnType<typeof setTimeout> | undefined

    function finish(status: string) {
      if (request !== voiceRequest.current) return
      clearTimeout(timer)
      voiceRequest.current += 1
      recognitionRef.current = null
      setListening(false)
      setCapturing(false)
      setVoiceStatus(status)
    }

    function stop() {
      setCapturing(false)
      setVoiceStatus('Finishing dictation…')
      clearTimeout(timer)
      timer = setTimeout(() => {
        finish('Dictation timed out. You can type your question.')
        recognition.abort()
      }, 8000)
      try {
        recognition.stop()
      } catch {
        finish('Dictation couldn’t finish. You can type your question.')
      }
    }

    recognitionRef.current = {
      stop,
      abort() {
        clearTimeout(timer)
        recognition.abort()
      },
    }
    recognition.onresult = event => {
      if (request !== voiceRequest.current) return
      transcript = Array.from(event.results, result => result[0]?.transcript ?? '').join(' ').trim().slice(0, 500)
    }
    recognition.onerror = ({ error }) => {
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        finish('Microphone access or browser dictation is blocked. Check your browser settings or type your question.')
      } else if (error === 'no-speech') {
        finish('No speech was detected. Try again or type your question.')
      } else {
        finish('Browser dictation is unavailable. You can type your question or use your device’s dictation.')
      }
    }
    recognition.onend = () => {
      if (request !== voiceRequest.current) return
      if (transcript) {
        setText(transcript)
        finish('Review or edit your question before submitting.')
      } else {
        finish('No speech was detected. Try again or type your question.')
      }
    }

    try {
      recognition.start()
      setListening(true)
      setCapturing(true)
      setVoiceStatus('Listening…')
      timer = setTimeout(stop, 20000)
    } catch {
      finish('Browser dictation couldn’t start. You can type your question.')
    }
  }

  function switchMode(next: Mode) {
    if (mode === next) return
    stopReading()
    voiceRequest.current += 1
    setCapturing(false)
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
    stopReading()
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text, previous: context.current, previousLanguage: language.current }),
        signal: AbortSignal.timeout(45000),
      })
      const answer: Result = await response.json()
      if (answer.context) context.current = answer.context
      if (answer.language) language.current = answer.language
      setResult(answer)
    } catch {
      const lang = scriptLanguage(text) ?? language.current ?? 'en'
      setResult({ message: unavailable[lang], language: lang })
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
          <input id="assistant-input" className={inputClass} value={text} dir="auto" onChange={event => setText(event.target.value)}
            placeholder={local ? 'Toronto, Ontario' : 'What is wudu?'} maxLength={local ? 100 : 500} required />
          {!local && (
            <button type="button" className={`${secondaryButton} shrink-0 px-3 py-2`} onClick={toggleVoice}
              disabled={busy || (listening && !capturing)} aria-label={capturing ? 'Stop voice input' : 'Speak your question'}>
              {capturing ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {capturing ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>
        {!local && <p role="status" className="mt-2 text-sm text-muted-foreground">{voiceStatus}</p>}
        {!local && <p className="mt-2 text-sm text-muted-foreground">Speak uses your browser’s language and may send audio to its speech provider. Read aloud uses your browser’s voices.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className={primaryButton} disabled={busy || listening || !text.trim()}>
            {busy ? 'Looking up your request…' : local ? 'Find masjids and times' : 'Find an answer'}
          </button>
          <button type="button" className={`${secondaryButton} px-3 py-2`}
            onClick={() => { if (result) void toggleReading(result) }} disabled={!result || busy || listening}
            aria-describedby={!result ? 'assistant-read-aloud-hint' : undefined}>
            {reading ? <Square className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
            {reading ? 'Stop reading' : 'Read aloud'}
          </button>
        </div>
        {!result && <p id="assistant-read-aloud-hint" className="mt-2 text-sm text-muted-foreground">Read aloud is available after a reply.</p>}
        {audioStatus && <p role="status" className="mt-2 text-sm text-muted-foreground">{audioStatus}</p>}
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {result && (
          <section lang={result.language ?? 'en'} dir="auto" aria-label="Assistant result" className="mt-5 rounded-2xl bg-surface p-5 sm:p-6">
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
