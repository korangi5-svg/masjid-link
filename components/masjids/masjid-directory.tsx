'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LoaderCircle, LocateFixed, Search, SearchX } from 'lucide-react'
import { MasjidCard, MasjidCardSkeleton } from '@/components/masjids/masjid-card'
import { MasjidMap } from '@/components/masjids/masjid-map'
import { NextPrayerBar } from '@/components/prayer/next-prayer'
import { searchMasjids } from '@/lib/api/masjids'
import { getCurrentLocation } from '@/lib/locate'
import { loadSavedArea, saveArea } from '@/lib/saved-area'
import { inputClass, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Masjid } from '@/lib/types'

const distanceOptions = [
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '15', label: 'Within 15 km' },
  { value: '25', label: 'Within 25 km' },
]

type Status = 'idle' | 'locating' | 'loading' | 'done' | 'error'
type Coords = { lat: number; lng: number }
type Origin = Coords & { label?: string }

// Searches against public OpenStreetMap servers can be slow; keep people informed while they wait.
function loadingMessage(seconds: number) {
  if (seconds < 4) return 'Searching OpenStreetMap for masjids…'
  if (seconds < 12) return 'Still searching — mapping servers can be busy, hang tight…'
  return 'Almost there — checking backup map servers…'
}

export function MasjidDirectory({
  initialMasjids,
  initialQuery,
  initialCoords,
  initialOrigin,
  initialRadius,
  initialPlace,
}: {
  initialMasjids: Masjid[]
  initialQuery: string
  initialCoords: Coords | null
  initialOrigin: Origin | null
  initialRadius: number
  initialPlace?: string
}) {
  const hasInitialSearch = Boolean(initialQuery || initialCoords)
  const [query, setQuery] = useState(initialQuery)
  const [distance, setDistance] = useState(String(initialRadius))
  const [coords, setCoords] = useState<Coords | null>(initialCoords)
  const [place, setPlace] = useState(initialQuery || (initialCoords ? initialPlace || 'your location' : ''))
  const [masjids, setMasjids] = useState(initialMasjids)
  const [origin, setOrigin] = useState(initialOrigin)
  const [status, setStatus] = useState<Status>(hasInitialSearch ? 'done' : 'idle')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const requestId = useRef(0)
  const searchId = useId()
  const distanceId = useId()

  // Returning visitors with no search in the URL land straight on their last area.
  useEffect(() => {
    if (hasInitialSearch) return
    const saved = loadSavedArea()
    if (saved) void runSearch({ coords: saved, place: saved.label, radiusKm: Number(distance) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'loading') return
    setElapsed(0)
    const started = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(id)
  }, [status])

  async function runSearch({ text, coords: at, place: label, radiusKm }: { text?: string; coords?: Coords; place: string; radiusKm: number }) {
    const id = ++requestId.current
    setStatus('loading')
    setError('')
    setPlace(label)
    setCoords(at ?? null)
    try {
      const result = await searchMasjids({ location: at ? undefined : text, lat: at?.lat, lng: at?.lng, radiusKm })
      if (id !== requestId.current) return
      setMasjids(result.masjids)
      setOrigin(result.origin)
      setStatus('done')
      syncUrl({ text, coords: at, place: label, radiusKm })
      if (result.origin) saveArea({ label, lat: result.origin.lat, lng: result.origin.lng })
    } catch (err) {
      if (id !== requestId.current) return
      setMasjids([])
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = query.trim()
    if (!text) {
      setStatus('error')
      setError('Enter a city, address or postal code, or use your current location.')
      return
    }
    void runSearch({ text, place: text, radiusKm: Number(distance) })
  }

  async function handleUseLocation() {
    const id = ++requestId.current
    setStatus('locating')
    setError('')
    try {
      const here = await getCurrentLocation()
      if (id !== requestId.current) return
      setQuery('')
      void runSearch({ coords: here, place: 'your location', radiusKm: Number(distance) })
    } catch (err) {
      if (id !== requestId.current) return
      setStatus('error')
      setError(err instanceof Error ? err.message : 'We could not get your location.')
    }
  }

  function handleDistanceChange(value: string) {
    setDistance(value)
    if (coords) void runSearch({ coords, place, radiusKm: Number(value) })
    else if (query.trim()) void runSearch({ text: query.trim(), place: query.trim(), radiusKm: Number(value) })
  }

  const busy = status === 'loading' || status === 'locating'
  const prayerTimes = masjids[0]?.prayerTimes
  const matchedPlace = !coords && origin?.label ? origin.label : null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end lg:flex-nowrap"
      >
        <div className="flex-1 sm:min-w-64">
          <label htmlFor={searchId} className="mb-1.5 block text-sm font-medium text-navy">
            City, address or postal code
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 123 Main St, Chicago or M5V 3L9"
              maxLength={100}
              enterKeyHint="search"
              className={cn(inputClass, 'pl-10')}
            />
          </div>
        </div>
        <div className="sm:w-44">
          <label htmlFor={distanceId} className="mb-1.5 block text-sm font-medium text-navy">
            Distance
          </label>
          <select id={distanceId} value={distance} onChange={(e) => handleDistanceChange(e.target.value)} className={inputClass}>
            {distanceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={handleUseLocation} disabled={busy} className={cn(secondaryButton, 'disabled:opacity-70')}>
          {status === 'locating' ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-4" aria-hidden="true" />
          )}
          {status === 'locating' ? 'Finding you…' : 'Near me'}
        </button>
        <button type="submit" disabled={busy} className={cn(secondaryButton, 'border-navy bg-navy text-white hover:bg-brand-blue hover:text-white disabled:opacity-70')}>
          {status === 'loading' ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          Search
        </button>
      </form>

      <div className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {status === 'locating' && <p>Asking your browser for your location…</p>}
        {status === 'loading' && <p>{loadingMessage(elapsed)}</p>}
        {status === 'error' && (
          <p role="alert" className="font-medium text-destructive">
            {error}
          </p>
        )}
        {status === 'done' && (
          <>
            <p>
              <strong className="text-navy">{masjids.length}</strong> masjid{masjids.length === 1 ? '' : 's'} within {distance} km of{' '}
              <strong className="text-navy">{place}</strong>
            </p>
            {matchedPlace && matchedPlace.toLowerCase() !== place.toLowerCase() ? (
              <p className="mt-1">
                Matched to <span className="text-navy">{matchedPlace}</span>. Not right? Add a city, state or postal code.
              </p>
            ) : null}
          </>
        )}
        {status === 'idle' && <p>Search an address, city or postal code — or tap “Near me”.</p>}
      </div>

      {status === 'loading' ? (
        <div aria-hidden="true">
          <div className="mt-4 h-80 animate-pulse rounded-2xl bg-surface sm:h-[28rem]" />
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <MasjidCardSkeleton />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === 'done' && masjids.length ? (
        <>
          {prayerTimes ? <NextPrayerBar times={prayerTimes} coords={origin ?? coords ?? undefined} place={place} className="mt-4" /> : null}
          <MasjidMap masjids={masjids} origin={origin} className="mt-4 h-80 sm:h-[28rem]" />
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {masjids.map((m) => (
              <li key={m.id}>
                <MasjidCard masjid={m} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {status === 'done' && !masjids.length ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">No masjids found in this area</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Try a wider distance or a nearby city. Listings come from OpenStreetMap — if a masjid is missing,{' '}
            <a
              href="https://www.openstreetmap.org/fixthemap"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-dark underline"
            >
              you can add it
            </a>
            .
          </p>
        </div>
      ) : null}

      {status === 'idle' ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <Search className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">Find masjids around you</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Works anywhere in the world. We’ll remember your area on this device so it’s ready next time.
          </p>
        </div>
      ) : null}
    </section>
  )
}

// Keep the address bar in step with the results so refresh, back and sharing work.
// history.replaceState is integrated with the Next.js router and does not trigger a server render.
function syncUrl({ text, coords, place, radiusKm }: { text?: string; coords?: Coords; place: string; radiusKm: number }) {
  const params = new URLSearchParams()
  if (coords) {
    params.set('lat', coords.lat.toFixed(4))
    params.set('lng', coords.lng.toFixed(4))
    if (place !== 'your location') params.set('near', place)
  } else if (text) {
    params.set('q', text)
  }
  if (radiusKm !== 15) params.set('r', String(radiusKm))
  window.history.replaceState(null, '', `/masjids?${params.toString()}`)
}
