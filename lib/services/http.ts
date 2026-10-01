const USER_AGENT = 'MasjidLink/1.0 (https://github.com/masjid-link; mosque locator)'

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 12000, headers, ...rest } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...headers,
      },
    })
    if (!res.ok) throw new HttpError(`Request failed (${res.status})`, res.status)
    return (await res.json()) as T
  } catch (error) {
    if (error instanceof HttpError) throw error
    if ((error as { name?: string }).name === 'AbortError') throw new HttpError('Request timed out')
    throw new HttpError('Network request failed')
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchText(url: string, init: RequestInit & { timeoutMs?: number; body?: string } = {}) {
  const { timeoutMs = 20000, headers, ...rest } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...headers,
      },
    })
    if (!res.ok) throw new HttpError(`Request failed (${res.status})`, res.status)
    return await res.text()
  } catch (error) {
    if (error instanceof HttpError) throw error
    if ((error as { name?: string }).name === 'AbortError') throw new HttpError('Request timed out')
    throw new HttpError('Network request failed')
  } finally {
    clearTimeout(timer)
  }
}
