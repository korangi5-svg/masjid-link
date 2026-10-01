type Entry<T> = { value: T; expiresAt: number }

const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number | ((value: T) => number),
  load: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== undefined) return hit
  const value = await load()
  cacheSet(key, value, typeof ttlMs === 'function' ? ttlMs(value) : ttlMs)
  return value
}
