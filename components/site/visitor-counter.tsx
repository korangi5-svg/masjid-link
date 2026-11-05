'use client'

import { useEffect, useState } from 'react'

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

  if (count === null) return null
  return <span className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2 text-xl font-semibold text-white sm:text-2xl" title="Approximate total based on distinct browsers since the counter launched">
    Website visitors: <strong className="text-3xl tabular-nums sm:text-4xl">{count.toLocaleString('en-CA')}</strong>
  </span>
}
