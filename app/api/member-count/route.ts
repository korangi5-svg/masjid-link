import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ownerId = '3f126b26-2c3f-43d5-9c7f-182fcb64f1c2'
const headers = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1]
  if (!token) return new NextResponse(null, { status: 401, headers })

  const db = getSupabaseAdmin()
  if (!db) return new NextResponse(null, { status: 503, headers })

  const { data: { user }, error: authError } = await db.auth.getUser(token)
  if (authError || !user) return new NextResponse(null, { status: 401, headers })
  if (user.id !== ownerId) return new NextResponse(null, { status: 403, headers })

  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (error) return new NextResponse(null, { status: 503, headers })
  const count = data.total || data.users.length

  return NextResponse.json({ count }, { headers })
}
