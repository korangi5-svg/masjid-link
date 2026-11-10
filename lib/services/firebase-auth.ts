import type { SignUpInput } from '@/lib/services/auth'

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY
export const firebaseSignupEnabled = process.env.NEXT_PUBLIC_FIREBASE_MEMBER_AUTH_ENABLED === 'true' && !!apiKey

interface FirebaseReply {
  idToken?: string
  localId?: string
  error?: { message?: string }
}

async function authRequest(operation: string, body: object): Promise<FirebaseReply> {
  const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:' + operation)
  url.searchParams.set('key', apiKey!)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export async function startFirebaseSignup({ email, password, ...details }: SignUpInput) {
  const credentials = { email, password, returnSecureToken: true }
  let account = await authRequest('signUp', credentials)
  if (account.error?.message === 'EMAIL_EXISTS') {
    account = await authRequest('signInWithPassword', credentials)
  }
  if (!account.idToken || !account.localId) {
    return { ok: false, error: 'Could not create this account. If you already have an account, please log in.' } as const
  }

  localStorage.setItem('firebase-member-details:' + account.localId, JSON.stringify(details))
  const verification = await authRequest('sendOobCode', {
    requestType: 'VERIFY_EMAIL',
    idToken: account.idToken,
  })
  if (verification.error) {
    return { ok: false, error: 'Could not send the confirmation email. Please try again.' } as const
  }
  return { ok: true, data: { needsConfirmation: true } } as const
}

export async function getFirebaseSession(email: string, password: string) {
  const account = await authRequest('signInWithPassword', { email, password, returnSecureToken: true })
  if (!account.idToken || !account.localId) return null

  const key = 'firebase-member-details:' + account.localId
  const response = await fetch('/api/auth/firebase-session', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + account.idToken, 'Content-Type': 'application/json' },
    body: localStorage.getItem(key) ?? '{}',
  })
  const result = await response.json() as { tokenHash?: string; error?: string }
  if (response.ok && result.tokenHash) {
    return { ok: true, tokenHash: result.tokenHash, clearDetails: () => localStorage.removeItem(key) } as const
  }
  if (result.error === 'invalid_profile') {
    return { ok: false, error: 'Open the signup page on this device and enter your account details to finish signup.' } as const
  }
  if (result.error === 'conflict') {
    return { ok: false, error: 'This email is already linked to an existing account. Use its original password to log in.' } as const
  }
  return { ok: false, error: result.error ?? 'Unable to log in.' } as const
}

export async function requestFirebasePasswordReset(email: string) {
  try {
    const result = await authRequest('sendOobCode', { requestType: 'PASSWORD_RESET', email })
    if (!result.error || result.error.message === 'EMAIL_NOT_FOUND') return { ok: true } as const
  } catch {
    // Keep the same response for temporary network and provider errors.
  }
  return { ok: false, error: 'Could not request a reset link right now. Please try again.' } as const
}

export async function resendFirebaseConfirmation(email: string, password: string) {
  const account = await authRequest('signInWithPassword', { email, password, returnSecureToken: true })
  if (!account.idToken) return null

  const result = await authRequest('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: account.idToken })
  return result.error
    ? { ok: false, error: 'Could not resend the confirmation email right now.' } as const
    : { ok: true } as const
}
