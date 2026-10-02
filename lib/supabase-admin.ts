import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null | undefined

/**
 * Server-only client using the secret key (bypasses row-level security). Returns null when
 * SUPABASE_SECRET_KEY isn't set, so callers can skip the shared cache.
 * Never import this from a client component.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (typeof window !== 'undefined') throw new Error('getSupabaseAdmin must only run on the server')
  if (adminClient !== undefined) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  adminClient = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
  return adminClient
}
