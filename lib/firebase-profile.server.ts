import { createHash } from 'node:crypto'
import { parseInterests } from '@/lib/interests'
import { getVerifiedFirebaseMember } from '@/lib/firebase-member.server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface MemberDetails {
  fullName: unknown
  location: unknown
  interests: unknown
}

export async function provisionFirebaseProfile(idToken: string, details: MemberDetails) {
  const member = await getVerifiedFirebaseMember(idToken)
  if (!member) return { status: 'unverified' } as const

  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Member profile creation is unavailable.')

  // Keep the member ID stable across simultaneous requests and retries.
  const idBytes = createHash('sha256').update('connect-to-masjid-41321:' + member.uid).digest()
  idBytes[6] = (idBytes[6] & 0x0f) | 0x80
  idBytes[8] = (idBytes[8] & 0x3f) | 0x80
  const hex = idBytes.subarray(0, 16).toString('hex')
  const id = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')

  const findLinkedMember = async () => {
    const { data, error } = await admin.auth.admin.getUserById(id)
    if (error && error.code !== 'user_not_found' && error.status !== 404) throw error
    if (!data?.user) return null
    const linked = data.user.app_metadata.firebase_uid === member.uid && data.user.email === member.email
    return linked ? { status: 'ready', id } as const : { status: 'conflict' } as const
  }

  const existing = await findLinkedMember()
  if (existing) return existing

  const fullName = typeof details.fullName === 'string' ? details.fullName.trim() : ''
  const location = typeof details.location === 'string' ? details.location.trim() : ''
  const interests = parseInterests(details.interests)
  if (!fullName || fullName.length > 100 || !location || location.length > 100 || !interests.length) {
    return { status: 'invalid_profile' } as const
  }

  const attributes = {
    id,
    email: member.email,
    email_confirm: true,
    app_metadata: { firebase_uid: member.uid },
    user_metadata: { full_name: fullName, location, interests, onboarding_completed: true },
  }
  const { data, error } = await admin.auth.admin.createUser(attributes)
  if (!error && data.user?.id === id) return { status: 'ready', id } as const

  // An existing Supabase account with this email remains owned by its original sign-in flow.
  if (error?.code === 'email_exists' || error?.code === 'user_already_exists' || error?.status === 409) {
    return await findLinkedMember() ?? { status: 'conflict' } as const
  }
  throw error ?? new Error('Member profile was created with an unexpected ID.')
}
