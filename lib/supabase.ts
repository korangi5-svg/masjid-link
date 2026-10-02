import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/features'

const REMEMBER_KEY = 'masjidlink:remember'

let browserClient: SupabaseClient | null = null

/**
 * Returns null until NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key are set,
 * so callers can fall back to sample data instead of crashing.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfig) return null

  // Server components only read public tables, so they get a fresh client with no session.
  if (typeof window === 'undefined') {
    return createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }

  browserClient ??= createClient(supabaseConfig.url, supabaseConfig.key, {
    auth: { storage: rememberAwareStorage },
  })
  return browserClient
}

/** "Remember me" keeps the session in localStorage; otherwise it lasts only for the browser session. */
export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {}
}

const rememberAwareStorage = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      const remember = localStorage.getItem(REMEMBER_KEY) !== '0'
      ;(remember ? localStorage : sessionStorage).setItem(key, value)
      ;(remember ? sessionStorage : localStorage).removeItem(key)
    } catch {}
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {}
  },
}
