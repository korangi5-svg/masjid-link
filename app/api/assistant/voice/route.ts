import { NextResponse } from 'next/server'
import { isLanguage } from '@/lib/assistant-language'
import { allowAssistantRequest } from '@/lib/services/assistant-limit'

const maxAudioBytes = 2 * 1024 * 1024
const audioTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']

function failure(status: number) {
  return NextResponse.json({ error: 'Voice service unavailable' }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return failure(403)
  const key = process.env.OPENAI_API_KEY
  if (process.env.ASSISTANT_PAID_SERVICES !== 'true' || !key) return failure(503)

  const length = Number(request.headers.get('content-length'))
  if (request.headers.has('content-length') && (!Number.isSafeInteger(length) || length <= 0)) return failure(400)
  const type = (request.headers.get('content-type') ?? '').split(';')[0]
  const transcribing = audioTypes.includes(type)
  if (!transcribing && type !== 'application/json') return failure(415)
  if (length > (transcribing ? maxAudioBytes : 8000)) return failure(413)
  if (!allowAssistantRequest(request, transcribing ? 'transcribe' : 'speak', 10)) return failure(429)

  const headers = { Authorization: `Bearer ${key}` }
  const signal = AbortSignal.timeout(12000)
  try {
    if (transcribing) {
      const bytes = await request.arrayBuffer()
      if (!bytes.byteLength || bytes.byteLength > maxAudioBytes) return failure(413)
      const body = new FormData()
      body.set('file', new Blob([bytes], { type }), `question.${type.split('/')[1]}`)
      body.set('model', process.env.ASSISTANT_TRANSCRIPTION_MODEL || 'gpt-4o-transcribe')
      body.set('prompt', 'Preserve the spoken language and code-switching. Islamic terms may include Assalamu Alaikum, wudu, salah, namaz, Jumu’ah, and masjid.')
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers, body, signal })
      if (!response.ok) return failure(503)
      const { text } = await response.json()
      if (typeof text !== 'string' || !text.trim()) return failure(422)
      return NextResponse.json({ text: text.trim().slice(0, 500) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const body = await request.text()
    if (new TextEncoder().encode(body).byteLength > 8000) return failure(413)
    const { text, language } = JSON.parse(body)
    if (typeof text !== 'string' || !text.trim() || text.length > 2500 || !isLanguage(language)) return failure(400)
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: text,
        instructions: `Read naturally in language ${language}. Preserve Islamic pronunciation and do not translate.` }),
    })
    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => null)
      const code = data?.error?.code
      console.warn('Assistant speech provider failure', {
        status: response.status, code: typeof code === 'string' && /^[a-z0-9_-]{1,80}$/i.test(code) ? code : 'unknown',
      })
      return failure(503)
    }
    return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  } catch {
    return failure(503)
  }
}
