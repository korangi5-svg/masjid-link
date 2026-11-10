const FIREBASE_PROJECT_ID = 'connect-to-masjid-41321'

interface VerifiedFirebaseMember {
  uid: string
  email: string
}

export async function getVerifiedFirebaseMember(idToken: string): Promise<VerifiedFirebaseMember | null> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY
  if (!apiKey) throw new Error('Firebase Authentication is not configured.')

  const parts = idToken.split('.')
  if (parts.length !== 3 || idToken.length > 8192) return null

  // Claims are only hints until Google has validated the original token below.
  let claims: { aud?: unknown; iss?: unknown; sub?: unknown; email?: unknown; email_verified?: unknown } | null
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (
    !claims ||
    claims.aud !== FIREBASE_PROJECT_ID ||
    claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` ||
    typeof claims.sub !== 'string' ||
    typeof claims.email !== 'string' ||
    claims.email_verified !== true
  ) return null

  const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup')
  url.searchParams.set('key', apiKey)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })

  if (response.status === 400 || response.status === 401) return null
  if (!response.ok) throw new Error('Firebase account verification is unavailable.')

  const { users } = await response.json() as {
    users?: Array<{ localId?: string; email?: string; emailVerified?: boolean; disabled?: boolean }>
  }
  const account = users?.[0]
  if (
    users?.length !== 1 ||
    !account?.localId ||
    account.localId !== claims.sub ||
    !account.email ||
    account.email !== claims.email ||
    account.emailVerified !== true ||
    account.disabled
  ) return null

  return { uid: account.localId, email: account.email }
}
