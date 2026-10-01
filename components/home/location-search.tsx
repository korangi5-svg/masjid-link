'use client'

import Link from 'next/link'
import { useId, useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle, LocateFixed, MapPin, Search } from 'lucide-react'
import { searchMasjids, type MasjidSearchParams } from '@/lib/api/masjids'
import { getCurrentLocation } from '@/lib/locate'
import { saveArea } from '@/lib/saved-area'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Masjid } from '@/lib/types'

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; query: string; masjids: Masjid[]; origin?: { lat: number; lng: number } }

export function LocationSearch() {
  const [location, setLocation] = useState('')
  const [state, setState] = useState<SearchState>({ status: 'idle' })
  const inputId = useId()
  const messageId = useId()

  async function runSearch(params: MasjidSearchParams, label: string, origin?: { lat: number; lng: number }) {
    setState({ status: 'loading' })
    try {
      const result = await searchMasjids(params)
      if (result.origin) saveArea({ label, lat: result.origin.lat, lng: result.origin.lng })
      setState({ status: 'done', query: label, masjids: result.masjids, origin })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Search failed. Please try again.' })
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const query = location.trim()
    if (!query) {
      setState({ status: 'error', message: 'Enter a city, address or postal code to search.' })
      return
    }
    await runSearch({ location: query }, query)
  }

  async function handleUseLocation() {
    setState({ status: 'loading' })
    try {
      const here = await getCurrentLocation()
      await runSearch({ lat: here.lat, lng: here.lng }, 'your location', here)
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'We could not get your location.' })
    }
  }

  const hasError = state.status === 'error'

  return (
    <div className="mt-8">
      <form
        role="search"
        onSubmit={handleSubmit}
        noValidate
        className={cn(
          'flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-xl shadow-navy/20 ring-2 transition-shadow focus-within:ring-mint',
          hasError ? 'ring-gold' : 'ring-transparent',
        )}
      >
        <MapPin className="size-5 shrink-0 text-teal" aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">
          City, address or postal code
        </label>
        <input
          id={inputId}
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address, city or postal code — anywhere"
          autoComplete="street-address"
          maxLength={100}
          aria-invalid={hasError || undefined}
          aria-describedby={messageId}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={state.status === 'loading'}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full p-3 text-navy transition-colors hover:bg-surface disabled:opacity-70',
            focusRing,
          )}
          aria-label="Find masjids near my current location"
          title="Near me"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue disabled:opacity-70 sm:px-7',
            focusRing,
          )}
        >
          {state.status === 'loading' ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          <span className="max-sm:sr-only">Search</span>
        </button>
      </form>

      <div id={messageId} aria-live="polite" className="mt-3">
        {state.status === 'error' && <p className="pl-5 text-sm font-medium text-gold">{state.message}</p>}
        {state.status === 'done' && (
          <SearchResults query={state.query} masjids={state.masjids} origin={state.origin} />
        )}
      </div>
    </div>
  )
}

function SearchResults({
  query,
  masjids,
  origin,
}: {
  query: string
  masjids: Masjid[]
  origin?: { lat: number; lng: number }
}) {
  const directoryHref = origin
    ? `/masjids?lat=${origin.lat.toFixed(4)}&lng=${origin.lng.toFixed(4)}`
    : `/masjids?q=${encodeURIComponent(query)}`

  if (!masjids.length) {
    return (
      <div className="rounded-xl bg-white/95 p-4 text-sm text-navy shadow-lg">
        <p>
          No masjids found near <strong>{query}</strong> yet. Try a wider area or a nearby city.
        </p>
        <Link href="/masjids" className={cn('mt-2 inline-flex items-center gap-1 font-semibold text-teal-dark hover:underline', focusRing)}>
          Open the masjid locator <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white/95 p-2 shadow-lg">
      <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {masjids.length} {masjids.length === 1 ? 'masjid' : 'masjids'} near {query}
      </p>
      <ul className="mt-1 divide-y divide-border">
        {masjids.slice(0, 3).map((m) => (
          <li key={m.id}>
            <Link
              href={`/masjids/${m.id}`}
              className={cn('flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-surface', focusRing)}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-navy">{m.name}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {[m.address, m.city].filter(Boolean).join(', ')}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-teal-dark">{m.distanceKm} km</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={directoryHref}
        className={cn('flex items-center justify-center gap-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-surface', focusRing)}
      >
        View all results <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
