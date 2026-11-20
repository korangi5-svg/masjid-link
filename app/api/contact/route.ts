import { after, NextResponse } from 'next/server'
import { contactInfo } from '@/lib/site'
import { getSupabase } from '@/lib/supabase'
import { validateEmail, validateRequired } from '@/lib/validation'
import type { ContactMessage } from '@/lib/types'
import { getContactPurpose } from '@/lib/contact-purposes'

export const runtime = 'nodejs'
const attempts = new Map<string, { count: number; until: number }>()
const confirmationAttempts = new Map<string, number>()
const failure = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

async function sendConfirmation(recipient: string, deliver: () => Promise<Response>) {
  const now = Date.now()
  for (const [email, expiry] of confirmationAttempts) {
    if (expiry <= now) confirmationAttempts.delete(email)
  }

  const address = recipient.toLowerCase()
  if (confirmationAttempts.has(address) || confirmationAttempts.size >= 10000) return
  confirmationAttempts.set(address, now + 600000)

  try {
    const response = await deliver()
    if (response.ok) return
    console.error('[contact] Confirmation email rejected:', response.status)
  } catch {
    console.error('[contact] Confirmation email request failed')
  }
  confirmationAttempts.delete(address)
}

function resendConfirmation(key: string, from: string, recipient: string, submissionId: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `contact-confirmation/${submissionId}`,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: contactInfo.email,
      subject: 'We received your message | Connect to Masjid',
      text: [
        'Assalamu Alaikum,',
        'Thank you for contacting Connect to Masjid. We’ve received your message and will review it. If a reply is needed, we’ll follow up at this email address, in shaa Allah.',
        'Connect to Masjid Team',
      ].join('\n\n'),
    }),
    signal: AbortSignal.timeout(10000),
  })
}

function emailJsConfirmation(recipient: string) {
  const { EMAILJS_SERVICE_ID, EMAILJS_CONTACT_CONFIRMATION_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env
  if (!EMAILJS_SERVICE_ID || !EMAILJS_CONTACT_CONFIRMATION_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) return

  return () => fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_CONTACT_CONFIRMATION_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: { recipient_email: recipient },
    }),
    signal: AbortSignal.timeout(10000),
  })
}

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
  const purpose = getContactPurpose(input.purpose)
  if (!purpose) return failure('Please select a valid purpose for your message.', 400)
  const fields = ['purpose', 'name', 'email', 'subject', 'message'] as const
  if (fields.some(key => typeof input[key] !== 'string')) return failure('Please complete all fields.', 400)
  const message = Object.fromEntries(fields.map(key => [key, (input[key] as string).trim()])) as unknown as ContactMessage
  if (validateRequired(message.name, 'name', 100) || validateEmail(message.email) || /[\r\n]/.test(message.email) || validateRequired(message.subject, 'subject', 150) || /[\r\n]/.test(message.subject) || validateRequired(message.message, 'message', 3000)) {
    return failure('Please enter a valid email address and complete all fields within their length limits.', 400)
  }
  const key = process.env.RESEND_API_KEY
  if (!key) return failure(`Email delivery is not configured yet. Please email ${contactInfo.email} directly.`, 503)
  // Best-effort per-instance throttle for contact submissions.
  const now = Date.now()
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const prior = attempts.get(ip)
  if ((prior?.count || 0) >= 3 || attempts.size >= 10000) return failure('Too many messages. Please wait ten minutes before trying again.', 429)
  attempts.set(ip, { count: (prior?.count || 0) + 1, until: prior?.until || now + 600000 })
  const from = process.env.CONTACT_FROM_EMAIL?.trim()
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from || 'Connect to Masjid <onboarding@resend.dev>',
        to: [contactInfo.email], reply_to: message.email,
        subject: `[Masjid Link · ${purpose.label}] ${message.subject}`,
        text: `Purpose: ${purpose.label}\nName: ${message.name}\nEmail: ${message.email}\n\n${message.message}`,
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
        const { purpose: _purpose, ...archive } = message
        const { error } = await db.from('contact_messages').insert({ ...archive, message: `Purpose: ${purpose.label}\n\n${message.message}` })
        if (error) console.error('[contact] Email accepted, archive failed')
      }
    } catch { console.error('[contact] Email accepted, archive unavailable') }
    const deliverConfirmation = emailJsConfirmation(message.email)
    if (deliverConfirmation) {
      after(() => sendConfirmation(message.email, deliverConfirmation))
    } else if (from && !/@resend\.dev(?:>|$)/i.test(from)) {
      after(() => sendConfirmation(message.email, () => resendConfirmation(key, from, message.email, result.id)))
    }
    return NextResponse.json({ ok: true })
  } catch {
    return failure(`We could not confirm email delivery. Please email ${contactInfo.email} directly.`, 502)
  }
}
