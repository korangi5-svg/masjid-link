const windows = new Map<string, { expires: number; count: number }>()

export function allowAssistantRequest(request: Request, action: string, limit: number) {
  const now = Date.now()
  const address = (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'local')
    .split(',')[0].trim().slice(0, 100)
  const key = `${action}:${address}`
  const existing = windows.get(key)
  if (existing && existing.expires > now) {
    if (existing.count >= limit) return false
    existing.count++
    return true
  }
  if (windows.size >= 2000) {
    for (const [key, value] of windows) if (value.expires <= now) windows.delete(key)
    if (windows.size >= 2000) return false
  }
  windows.set(key, { expires: now + 60_000, count: 1 })
  return true
}
