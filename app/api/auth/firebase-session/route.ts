import { NextResponse } from 'next/server'
import { provisionFirebaseProfile } from '@/lib/firebase-profile.server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  if (process.env.FIREBASE_MEMBER_AUTH_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Firebase sign-in is unavailable.' }, { status: 404 })
  }

  try {
    const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 })

    const details = await request.json().catch(() => null)
    const result = await provisionFirebaseProfile(token, {
      fullName: details?.fullName,
      location: details?.location,
      interests: details?.interests,
    })
    if (result.status === 'unverified') {
      return NextResponse.json({ error: 'Confirm your email before signing in.' }, { status: 403 })
    }
    if (result.status !== 'ready') {
      return NextResponse.json({ error: result.status }, { status: 409 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Member sign-in is unavailable.')

    const { data: account, error: accountError } = await admin.auth.admin.getUserById(result.id)
    if (accountError || !account.user?.email) throw new Error('Member account is unavailable.')

    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: account.user.email })
    if (error || data.user?.id !== result.id || !data.properties?.hashed_token) {
      throw new Error('Could not create a member session.')
    }

    return NextResponse.json(
      { tokenHash: data.properties.hashed_token },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ error: 'Member sign-in is temporarily unavailable.' }, { status: 503 })
  }
}
