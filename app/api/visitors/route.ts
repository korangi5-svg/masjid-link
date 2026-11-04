import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return new NextResponse(null, { status: 403 })
  }

  const body = await request.text()
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body)) {
    return new NextResponse(null, { status: 400 })
  }

  const db = getSupabaseAdmin()
  if (!db) return new NextResponse(null, { status: 503 })

  const visitorHash = createHash('sha256').update(body).digest('hex')
  const { error } = await db.from('site_visitors').upsert(
    { visitor_hash: visitorHash },
    { onConflict: 'visitor_hash', ignoreDuplicates: true },
  )
  if (error) return new NextResponse(null, { status: 503 })

  const { count, error: countError } = await db.from('site_visitors')
    .select('visitor_hash', { count: 'exact', head: true })
  if (countError || count === null) return new NextResponse(null, { status: 503 })

  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } })
}
