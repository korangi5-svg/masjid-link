import { contactInfo } from '@/lib/site'
import { getSupabase } from '@/lib/supabase'
import type { ContactMessage, ServiceResult } from '@/lib/types'

export async function submitContactMessage(message: ContactMessage): Promise<ServiceResult> {
  const supabase = getSupabase()
  // Never pretend a message was sent when there is nowhere to store it.
  if (!supabase) return { ok: false, error: `The contact form isn't connected yet. Please email us at ${contactInfo.email}.` }

  const { error } = await supabase.from('contact_messages').insert(message)
  if (error) {
    console.error('[contact] Failed to save message:', error.message)
    return { ok: false, error: 'We could not send your message. Please try again.' }
  }
  return { ok: true }
}
