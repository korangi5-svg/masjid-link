'use client'

import Link from 'next/link'
import { Mic, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

import { locales, scriptLanguage, unavailable, type Language } from '@/lib/assistant-language'
import type { AssistantContext } from '@/lib/services/assistant-ai'

type Mode = 'local' | 'question'
type Result = { message: string; language?: Language; context?: AssistantContext; links?: { label: string; href: string }[]; details?: string[] }

export function Assistant({ paidVoice = false }: { paidVoice?: boolean }) {
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

  async function toggleReading(answer: Result) {
    if (playback.current) return stopReading()

    const controller = new AbortController()
    let audio: HTMLAudioElement | undefined
    let url: string | undefined
    let synthesizing = false
    const active = {
      cancel() {
        controller.abort()
        audio?.pause()
        if (url) URL.revokeObjectURL(url)
        if (synthesizing) window.speechSynthesis.cancel()
      },
    }
    playback.current = active
    setReading(true)
    setAudioStatus('')
    const lang = answer.language ?? 'en'
    const spoken = [answer.message, ...(answer.details ?? [])].join(' ').slice(0, 2500)
    const done = () => { if (playback.current === active) stopReading() }
    const failed = () => {
      if (playback.current !== active) return
      stopReading()
      setAudioStatus(unavailable[lang])
    }

    try {
      if (!paidVoice) throw new Error('Use device speech')
      const response = await fetch('/api/assistant/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spoken, language: lang }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      })
      if (!response.ok) throw new Error('Speech request failed')
      const blob = await response.blob()
      if (playback.current !== active) return
      url = URL.createObjectURL(blob)
      audio = new Audio(url)
      audio.onended = done
      await audio.play()
      audio.onerror = failed
    } catch {
      if (playback.current !== active) return
      const synthesis = window.speechSynthesis
      if (!synthesis || typeof SpeechSynthesisUtterance !== 'function') return failed()
      const voice = synthesis.getVoices().find(voice => voice.lang.toLowerCase() === locales[lang].toLowerCase())
        ?? synthesis.getVoices().find(voice => voice.lang.toLowerCase().split('-')[0] === lang)
      if (!voice && lang !== 'en') return failed()
      const speech = new SpeechSynthesisUtterance(spoken)
      speech.lang = voice?.lang ?? locales[lang]
      if (voice) speech.voice = voice
      speech.onend = done
      speech.onerror = failed
      try {
        synthesizing = true
        synthesis.speak(speech)
      } catch { failed() }
    }
  }

  async function toggleVoice() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

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
    }
    const stop = () => { if (recorder?.state === 'recording') recorder.stop() }
    recognitionRef.current = { stop, abort() { controller.abort(); stop(); release() } }
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
            method: 'POST', body: audio, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          })
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
      setVoiceStatus('Listening…')
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
          <input id="assistant-input" className={inputClass} value={text} dir="auto" onChange={event => setText(event.target.value)}
            placeholder={local ? 'Toronto, Ontario' : 'What is wudu?'} maxLength={local ? 100 : 500} required />
          {!local && paidVoice && (
            <button type="button" className={`${secondaryButton} shrink-0 px-3 py-2`} onClick={toggleVoice}
              disabled={busy || (listening && !capturing)} aria-label={capturing ? 'Stop voice input' : 'Speak your question'}>
              {capturing ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {capturing ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>
        {!local && <p role="status" className="mt-2 text-sm text-muted-foreground">{voiceStatus}</p>}
        {!local && <p className="mt-2 text-sm text-muted-foreground">{paidVoice ? 'Search published answers. Voice input and generated speech use OpenAI.' : 'Search published answers. Multilingual lookup covers wudu, the five daily prayers, and Shahadah. Read aloud uses your device’s voices.'}</p>}
        <button type="submit" className={`${primaryButton} mt-4`} disabled={busy || listening || !text.trim()}>
          {busy ? 'Looking up your request…' : local ? 'Find masjids and times' : 'Find an answer'}
        </button>
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {result && (
          <section lang={result.language ?? 'en'} dir="auto" aria-label="Assistant result" className="mt-5 rounded-2xl bg-surface p-5 sm:p-6">
            <p className="leading-relaxed text-navy">{result.message}</p>
            <button type="button" className={`${secondaryButton} mt-3 px-3 py-2`}
              onClick={() => toggleReading(result)} disabled={listening}>
              {reading ? <Square className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
              {reading ? 'Stop reading' : 'Read aloud'}
            </button>
            {audioStatus && <p role="status" className="mt-2 text-sm text-muted-foreground">{audioStatus}</p>}
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
