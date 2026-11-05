'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

const storageKey = 'masjid-link-visitor-id'
let visit: Promise<number> | undefined

async function countVisit() {
  let id = localStorage.getItem(storageKey)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(storageKey, id)
  }

  const response = await fetch('/api/visitors', { method: 'POST', body: id })
  if (!response.ok) throw new Error('Visitor total unavailable')
  const data: { count: number } = await response.json()
  return data.count
}

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    visit ??= countVisit().catch(error => {
      visit = undefined
      throw error
    })
    visit.then(total => {
      if (active) setCount(total)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  return <>
    {count !== null && <VisitorTotal count={count} />}
    <RegisteredMembers />
  </>
}

function VisitorTotal({ count }: { count: number }) {
  return <span className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2 text-xl font-semibold text-white sm:text-2xl" title="Approximate total based on distinct browsers since the counter launched">
    Website visitors: <strong className="text-3xl tabular-nums sm:text-4xl">{count.toLocaleString('en-CA')}</strong>
  </span>
}

function RegisteredMembers() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const auth = getSupabase()?.auth
    if (!auth) return
    let request: AbortController | undefined

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      request?.abort()
      setCount(null)
      if (!session) return

      const controller = new AbortController()
      request = controller
      void fetch('/api/member-count', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
        cache: 'no-store',
      }).then(async response => {
        if (!response.ok) return
        const data: { count: number } = await response.json()
        if (!controller.signal.aborted) setCount(data.count)
      }).catch(() => {})
    })

    return () => {
      subscription.unsubscribe()
      request?.abort()
    }
  }, [])

  if (count === null) return null
  return <span className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2 text-xl font-semibold text-white sm:text-2xl">
    Registered members: <strong className="text-3xl tabular-nums sm:text-4xl">{count.toLocaleString('en-CA')}</strong>
  </span>
}
