import { NextResponse } from 'next/server'
import { contactInfo } from '@/lib/site'
import { getSupabase } from '@/lib/supabase'
import { validateEmail, validateRequired } from '@/lib/validation'
import type { ContactMessage } from '@/lib/types'

export const runtime = 'nodejs'
const attempts = new Map<string, { count: number; until: number }>()
const failure = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return failure('Please submit from this website.', 403)
  if (!request.headers.get('content-type')?.includes('application/json')) return failure('Invalid request format.', 415)
  if (Number(request.headers.get('content-length') || 0) > 24000) return failure('Message is too large.', 413)
  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > 24000) return failure('Message is too large.', 413)
    raw = JSON.parse(text)
  } catch { return failure('Invalid message.', 400) }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return failure('Invalid message.', 400)
  const input = raw as Record<string, unknown>
  const fields = ['name', 'email', 'subject', 'message'] as const
  if (fields.some(key => typeof input[key] !== 'string')) return failure('Please complete all fields.', 400)
  const message = Object.fromEntries(fields.map(key => [key, (input[key] as string).trim()])) as unknown as ContactMessage
  if (validateRequired(message.name, 'name', 100) || validateEmail(message.email) || /[\r\n]/.test(message.email) || validateRequired(message.subject, 'subject', 150) || /[\r\n]/.test(message.subject) || validateRequired(message.message, 'message', 3000)) {
    return failure('Please enter a valid email address and complete all fields within their length limits.', 400)
  }
  const key = process.env.RESEND_API_KEY
  if (!key) return failure(`Email delivery is not configured yet. Please email ${contactInfo.email} directly.`, 503)
  // Best-effort per-instance throttle; the recipient is fixed server-side.
  const now = Date.now()
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const prior = attempts.get(ip)
  if ((prior?.count || 0) >= 3 || attempts.size >= 10000) return failure('Too many messages. Please wait ten minutes before trying again.', 429)
  attempts.set(ip, { count: (prior?.count || 0) + 1, until: prior?.until || now + 600000 })
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'Connect to Masjid <onboarding@resend.dev>',
        to: [contactInfo.email], reply_to: message.email,
        subject: `[Masjid Link] ${message.subject}`,
        text: `Name: ${message.name}\nEmail: ${message.email}\n\n${message.message}`,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const result = await response.json()
    if (!response.ok || !result.id) {
      console.error('[contact] Email provider rejected request:', response.status, result.name)
      if (response.status === 403 && typeof result.message === 'string' && /testing emails|own email address/i.test(result.message)) {
        return failure('Resend is restricting delivery to its account email. The site owner must verify a sending domain or use a Resend account registered with the Outlook recipient.', 502)
      }
      return failure(`Email delivery failed. Please email ${contactInfo.email} directly.`, 502)
    }
    try {
      const db = getSupabase()
      if (db) {
        const { error } = await db.from('contact_messages').insert(message)
        if (error) console.error('[contact] Email accepted, archive failed')
      }
    } catch { console.error('[contact] Email accepted, archive unavailable') }
    return NextResponse.json({ ok: true })
  } catch {
    return failure(`We could not confirm email delivery. Please email ${contactInfo.email} directly.`, 502)
  }
}
