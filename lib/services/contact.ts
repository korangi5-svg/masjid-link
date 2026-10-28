import type { ContactMessage, ServiceResult } from '@/lib/types'

export async function submitContactMessage(message: ContactMessage): Promise<ServiceResult> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message),
    })
    const result = await response.json()
    if (!response.ok || result.ok !== true) return { ok: false, error: result.error || 'Unable to send your message. Please try again.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Unable to reach the contact service. Check your connection and try again.' }
  }
}
