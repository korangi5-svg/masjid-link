import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { completePathModule, parsePathProgress } from '@/lib/learning-path'

export const dynamic = 'force-dynamic'
async function authenticate(request: Request) {
  const db = getSupabaseAdmin()
  if (!db) return { response: NextResponse.json({ error: 'Account progress is temporarily unavailable. Please try again later.' }, { status: 503 }) } as const
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return { response: NextResponse.json({ error: 'Log in to save your learning path.' }, { status: 401 }) } as const
  const result = await db.auth.getUser(token)
  if (result.error || !result.data.user) return { response: NextResponse.json({ error: 'Your session expired. Please log in again.' }, { status: 401 }) } as const
  return { db, user: result.data.user } as const
}
export async function GET(request: Request) {
  try {
    const auth = await authenticate(request)
    if (auth.response) return auth.response
    return NextResponse.json(parsePathProgress(auth.user.app_metadata?.new_muslim_path), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return NextResponse.json({ error: 'Could not load progress. Please try again.' }, { status: 503 }) }
}
export async function POST(request: Request) {
  try {
    const auth = await authenticate(request)
    if (auth.response) return auth.response
    let body: { moduleId?: unknown; answer?: unknown }
    try { body = await request.json(); if (!body || typeof body !== 'object') throw new Error() }
    catch { return NextResponse.json({ error: 'Invalid knowledge-check submission.' }, { status: 400 }) }
    let progress
    try { progress = completePathModule(auth.user.app_metadata?.new_muslim_path, body.moduleId, body.answer) }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid module.' }, { status: 400 }) }
    // Server-managed progress cannot be changed through user-editable profile metadata.
    const saved = await auth.db.auth.admin.updateUserById(auth.user.id, { app_metadata: { ...auth.user.app_metadata, new_muslim_path: progress } })
    if (saved.error) return NextResponse.json({ error: 'Could not save completion. Your next module has not been unlocked. Please try again.' }, { status: 503 })
    return NextResponse.json(progress, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return NextResponse.json({ error: 'Could not save progress. Please try again.' }, { status: 503 }) }
}
