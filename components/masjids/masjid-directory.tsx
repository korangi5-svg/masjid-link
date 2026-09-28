'use client'

import { useId, useMemo, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { MasjidCard } from '@/components/masjids/masjid-card'
import { filterMasjids } from '@/lib/masjid-filters'
import { inputClass, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Masjid } from '@/lib/types'

const distanceOptions = [
  { value: '', label: 'Any distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
]

export function MasjidDirectory({ masjids, initialQuery }: { masjids: Masjid[]; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [distance, setDistance] = useState('')
  const searchId = useId()
  const distanceId = useId()

  const results = useMemo(
    () => filterMasjids(masjids, { query, maxDistanceKm: distance ? Number(distance) : null }),
    [masjids, query, distance],
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div role="search" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="mb-1.5 block text-sm font-medium text-navy">
            Search masjids
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, postal code, or masjid name"
              maxLength={100}
              className={cn(inputClass, 'pl-10')}
            />
          </div>
        </div>
        <div className="sm:w-52">
          <label htmlFor={distanceId} className="mb-1.5 block text-sm font-medium text-navy">
            Distance
          </label>
          <select id={distanceId} value={distance} onChange={(e) => setDistance(e.target.value)} className={inputClass}>
            {distanceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        Showing <strong className="text-navy">{results.length}</strong> of {masjids.length} masjids
      </p>

      {results.length ? (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((m) => (
            <li key={m.id}>
              <MasjidCard masjid={m} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">No masjids match your search</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Try a different city or postal code, or widen the distance filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setDistance('')
            }}
            className={cn(secondaryButton, 'mt-6')}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  )
}
