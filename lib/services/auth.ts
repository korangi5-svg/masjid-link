import type { AuthError } from '@supabase/supabase-js'
import { getSupabase, setRememberSession } from '@/lib/supabase'
import type { ServiceResult } from '@/lib/types'
import { parseInterests, type Interest } from '@/lib/interests'

const NOT_CONFIGURED = 'Accounts are not available yet. They will be enabled once the database is connected.'

function toMessage(error: AuthError | null) {
  const messages: Record<string, string> = {
    invalid_credentials: 'Incorrect email or password.',
    email_not_confirmed: 'Please confirm your email first — check your inbox for the link.',
    user_already_exists: 'An account with this email already exists.',
    email_exists: 'An account with this email already exists.',
    weak_password: 'Please choose a stronger password.',
    same_password: 'Your new password must be different from the old one.',
    over_request_rate_limit: 'Too many attempts. Please try again later.',
    over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  }
  return messages[error?.code ?? ''] ?? 'Something went wrong. Please try again.'
}

export async function signIn(email: string, password: string, remember: boolean): Promise<ServiceResult> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  setRememberSession(remember)
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: toMessage(error) } : { ok: true }
}

export interface SignUpInput {
  fullName: string
  email: string
  password: string
  location: string
  interests: Interest[]
}

/** needsConfirmation is true when the project requires email confirmation before first sign-in. */
export async function signUp({ fullName, email, password, location, interests }: SignUpInput): Promise<ServiceResult<{ needsConfirmation: boolean }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const selected = parseInterests(interests)
  if (!selected.length) return { ok: false, error: 'Please choose at least one interest.' }
  setRememberSession(true)
  // Profile fields travel as user metadata; a database trigger copies them into public.profiles.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, location, interests: selected, onboarding_completed: true },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })
  if (error) return { ok: false, error: toMessage(error) }
  return { ok: true, data: { needsConfirmation: !data.session } }
}

export async function requestPasswordReset(email: string): Promise<ServiceResult> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return error ? { ok: false, error: toMessage(error) } : { ok: true }
}

export async function updatePassword(password: string): Promise<ServiceResult> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await supabase.auth.updateUser({ password })
  return error ? { ok: false, error: toMessage(error) } : { ok: true }
}

export async function signOut(): Promise<ServiceResult> {
  const supabase = getSupabase()
  if (!supabase) return { ok: true }
  const { error } = await supabase.auth.signOut()
  return error ? { ok: false, error: 'Could not log out. Please try again.' } : { ok: true }
}

export interface Profile {
  fullName: string
  location: string
}

/** The signed-in user's profile row, falling back to their sign-up details if the row can't be read. */
export async function getProfile(): Promise<ServiceResult<Profile>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { ok: false, error: 'Please log in again.' }
  const { data } = await supabase.from('profiles').select('full_name, location').eq('id', user.id).maybeSingle()
  return {
    ok: true,
    data: {
      fullName: data?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? '',
      location: data?.location ?? (user.user_metadata?.location as string | undefined) ?? '',
    },
  }
}

export async function updateProfile({ fullName, location }: Profile): Promise<ServiceResult> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { ok: false, error: 'Please log in again.' }
  const { error } = await supabase.from('profiles').update({ full_name: fullName, location }).eq('id', user.id)
  if (error) return { ok: false, error: 'Could not save your profile. Please try again.' }
  // Keep the sign-in metadata in step so the header shows the new name straight away.
  const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: fullName, location } })
  return metaError ? { ok: false, error: toMessage(metaError) } : { ok: true }
}

