'use client'

import Link from 'next/link'
import { Mic, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

import { locales, scriptLanguage, unavailable, type Language } from '@/lib/assistant-language'
import type { AssistantContext } from '@/lib/services/assistant-ai'

type Mode = 'local' | 'question'
type Result = { message: string; language?: Language; context?: AssistantContext; links?: { label: string; href: string }[]; details?: string[] }

type BrowserRecognition = {
  lang: string
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const dictationLanguages = [
  ['en-CA', 'English (Canada)'],
  ['en-US', 'English (United States)'],
  ['en-GB', 'English (United Kingdom)'],
  [locales.ar, 'العربية'],
  [locales.bn, 'বাংলা'],
  [locales.hi, 'हिन्दी'],
  [locales.id, 'Bahasa Indonesia'],
  [locales.zh, '普通话'],
  [locales.ur, 'اردو'],
] as const

function recognitionConstructor() {
  const browser = window as Window & {
    SpeechRecognition?: new () => BrowserRecognition
    webkitSpeechRecognition?: new () => BrowserRecognition
  }
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition
}

export function Assistant({ serverDictation }: { serverDictation: boolean }) {
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
  const [speechLocale, setSpeechLocale] = useState('')

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

    if (serverDictation && navigator.mediaDevices?.getUserMedia && typeof MediaRecorder === 'function') {
      void recordVoice()
      return
    }

    const Recognition = recognitionConstructor()
    if (!Recognition) {
      setVoiceStatus('This browser doesn’t support dictation. You can type your question or use your device’s dictation.')
      return
    }

    stopReading()
    const request = ++voiceRequest.current
    let recognition: BrowserRecognition
    try {
      recognition = new Recognition()
      recognition.lang = speechLocale || navigator.language || locales.en
      recognition.interimResults = true
    } catch {
      setVoiceStatus('Browser dictation couldn’t start. You can type your question.')
      return
    }
    let transcript = ''
    let stopping = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function finish(status: string) {
      if (request !== voiceRequest.current) return
      clearTimeout(timer)
      voiceRequest.current += 1
      recognitionRef.current = null
      setListening(false)
      setCapturing(false)
      if (transcript) setText(transcript)
      setVoiceStatus(transcript ? 'Review or edit your question before submitting.' : status)
    }

    function stop() {
      if (request !== voiceRequest.current || stopping) return
      stopping = true
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
    recognition.onstart = () => {
      if (request === voiceRequest.current && !stopping) setVoiceStatus('Listening…')
    }
    recognition.onresult = event => {
      if (request !== voiceRequest.current) return
      const results = Array.from(event.results)
      transcript = results.filter(result => result.isFinal)
        .map(result => result[0]?.transcript ?? '').join(' ').trim().slice(0, 500)
      if (!stopping) {
        const preview = results.map(result => result[0]?.transcript ?? '').join(' ').trim().slice(0, 500)
        if (preview) setVoiceStatus(preview)
      }
    }
    recognition.onerror = ({ error }) => {
      if (error === 'not-allowed') {
        finish('Allow microphone access for this site in your browser, then try again.')
      } else if (error === 'audio-capture') {
        finish('Your microphone couldn’t be accessed. Check your device’s microphone settings or type your question.')
      } else if (error === 'language-not-supported' || error === 'language-unavailable') {
        finish('Your browser couldn’t recognize this language. Choose another speech language or type your question.')
      } else if (error === 'network') {
        finish('The browser’s speech service couldn’t connect. Try again or type your question.')
      } else if (error === 'service-not-allowed') {
        finish('Your browser blocked its speech service. You can type your question or use your device’s dictation.')
      } else if (error === 'no-speech') {
        finish('No speech was detected. Try again or type your question.')
      } else {
        finish('Browser dictation is unavailable. You can type your question or use your device’s dictation.')
      }
    }
    recognition.onend = () => finish('No speech was detected. Try again or type your question.')

    try {
      setListening(true)
      setCapturing(true)
      setVoiceStatus('Starting microphone…')
      timer = setTimeout(stop, 20000)
      recognition.start()
    } catch {
      finish('Browser dictation couldn’t start. You can type your question.')
    }
  }

  async function recordVoice() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder !== 'function') {
      setVoiceStatus('Voice input is unavailable in this browser. You can type your question.')
      return
    }

    stopReading()
    const request = ++voiceRequest.current
    const controller = new AbortController()
    let stream: MediaStream | undefined
    let recorder: MediaRecorder | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const release = () => {
      clearTimeout(timer)
      stream?.getTracks().forEach(track => track.stop())
      stream = undefined
    }
    const stop = () => {
      if (recorder?.state !== 'recording') return
      setCapturing(false)
      setVoiceStatus('Finishing recording…')
      recorder.stop()
    }
    recognitionRef.current = { stop, abort() { controller.abort(); release() } }
    setListening(true)
    setVoiceStatus('Checking microphone access…')

    function finish(status: string) {
      if (request !== voiceRequest.current) return
      recognitionRef.current = null
      setListening(false)
      setCapturing(false)
      setVoiceStatus(status)
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (controller.signal.aborted) { release(); return }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type))
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        controller.abort()
        release()
        finish('Voice input couldn’t capture your question. Try again or type it.')
      }
      recorder.onstop = async () => {
        release()
        if (controller.signal.aborted || request !== voiceRequest.current) return
        setCapturing(false)
        setVoiceStatus('Transcribing…')
        try {
          const audio = new Blob(chunks, { type: recorder?.mimeType || chunks[0]?.type })
          if (!audio.size) return finish('No speech was captured. Try again or type your question.')
          const response = await fetch('/api/assistant/voice', {
            method: 'POST',
            headers: speechLocale ? { 'X-Speech-Language': speechLocale.split('-')[0] } : undefined,
            body: audio,
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          })
          if (response.status === 422) return finish('No speech was captured. Try again or type your question.')
          if (response.status === 429) return finish('Too many voice requests. Wait a moment and try again.')
          if (!response.ok) throw new Error('Transcription failed')
          const { text: transcript } = await response.json()
          if (request !== voiceRequest.current) return
          if (typeof transcript !== 'string' || !transcript.trim()) return finish('No speech was captured. Try again or type your question.')
          setText(transcript)
          finish('Review or edit your question before submitting.')
        } catch {
          finish('Voice input couldn’t transcribe your question. Try again or type it.')
        }
      }
      recorder.start()
      timer = setTimeout(stop, 20_000)
      setCapturing(true)
      setVoiceStatus('Recording… Select Stop when you’re done.')
    } catch (error) {
      release()
      const denied = error instanceof DOMException && error.name === 'NotAllowedError'
      finish(denied ? 'Microphone access was denied. Allow it in your browser settings or type your question.'
        : 'Voice input couldn’t start. You can type your question.')
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
          <input id="assistant-input" className={cn(inputClass, "border-4 border-navy focus:border-navy")} value={text} readOnly={listening} dir="auto" onChange={event => setText(event.target.value)}
            placeholder={local ? 'Toronto, Ontario' : 'What is wudu?'} maxLength={local ? 100 : 500} required />
          {!local && (
            <button type="button" className={cn(primaryButton, "shrink-0 px-4 font-bold")} onClick={toggleVoice}
              disabled={busy || (listening && !capturing)} aria-label={capturing ? 'Stop voice input' : 'Speak your question'}>
              {capturing ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {capturing ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>
        {!local && <p role="status" className="mt-2 text-sm text-muted-foreground">{voiceStatus}</p>}
        {!local && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="assistant-speech-language">Speech language</label>
            <select id="assistant-speech-language" className="rounded-md border border-border bg-background px-2 py-1"
              value={speechLocale} disabled={busy || listening} onChange={event => setSpeechLocale(event.target.value)}>
              <option value="">{serverDictation ? 'Detect automatically' : 'Browser default'}</option>
              {dictationLanguages.map(([locale, label]) => <option key={locale} value={locale}>{label}</option>)}
            </select>
          </div>
        )}
        {!local && <p className="mt-2 text-sm text-muted-foreground">{serverDictation ? 'Speak sends your recording to OpenAI for transcription on supported browsers. Otherwise your browser may use its own speech provider.' : 'Your browser may send microphone audio to its speech provider.'} Read aloud uses your browser’s voices.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className={primaryButton} disabled={busy || listening || !text.trim()}>
            {busy ? 'Looking up your request…' : local ? 'Find masjids and times' : 'Find an answer'}
          </button>
          <button type="button" className={cn(primaryButton, "px-4 font-bold disabled:opacity-80")}
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
