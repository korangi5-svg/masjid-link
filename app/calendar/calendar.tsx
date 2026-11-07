'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { GeometricPattern } from '@/components/home/geometric-pattern'
import { haversineKm } from '@/lib/geo'
import { DAILY_PRAYERS, formatCountdown, getNextPrayer } from '@/lib/prayer'
import type { CommunityEvent, PrayerTimes } from '@/lib/types'
import { inputClass, secondaryButton } from '@/lib/site'

const weekdays = [
  { label: 'Sun', colors: 'border-rose-400 bg-rose-200 text-rose-950' },
  { label: 'Mon', colors: 'border-sky-400 bg-sky-200 text-sky-950' },
  { label: 'Tue', colors: 'border-emerald-400 bg-emerald-200 text-emerald-950' },
  { label: 'Wed', colors: 'border-amber-400 bg-amber-200 text-amber-950' },
  { label: 'Thu', colors: 'border-violet-400 bg-violet-200 text-violet-950' },
  { label: 'Fri', colors: 'border-teal-400 bg-teal-200 text-teal-950' },
  { label: 'Sat', colors: 'border-indigo-400 bg-indigo-200 text-indigo-950' },
]

const tileColors = {
  Islamic: { label: 'Islamic observance', tile: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100' },
  Holiday: { label: 'Public holiday', tile: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40', badge: 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100' },
  Masjid: { label: 'Masjid event', tile: 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40', badge: 'bg-violet-100 text-violet-900 dark:bg-violet-900/60 dark:text-violet-100' },
  Note: { label: 'Personal note', tile: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40', badge: 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100' },
}

const filterOptions = [
  { key: 'Holiday', label: 'Canadian holidays' },
  { key: 'Islamic', label: 'Islamic observances' },
  { key: 'Masjid', label: 'Masjid events' },
  { key: 'Note', label: 'Personal notes' },
] as const

type FilterKey = typeof filterOptions[number]['key']

const DAY = 86400000
const defaultPlace = { label: 'Toronto, Ontario, Canada', city: 'Toronto', lat: 43.65348, lng: -79.38393, country: 'CA', region: 'CA-ON' }
type Place = Omit<typeof defaultPlace, 'country' | 'region'> & { country?: string; region?: string }
type Holiday = { date: string; name: string; scope: string }

const observances = [
  { month: 1, day: 1, title: 'Islamic New Year', description: 'The first day of Muharram marks the start of a new Hijri year.' },
  { month: 1, day: 10, title: 'Ashura', description: 'The tenth day of Muharram, observed in different ways across Muslim communities.' },
  { month: 3, day: 12, title: 'Mawlid al-Nabawi', description: 'A remembrance of the Prophet Muhammad’s birth, observed by many Muslim communities.' },
  { month: 7, day: 27, title: 'Isra and Mi’raj', description: 'A remembrance of the Night Journey and Ascension, observed by many Muslim communities.' },
  { month: 9, day: 1, title: 'Start of Ramadan', description: 'The first day of the month of fasting, prayer, and reflection.' },
  { month: 10, day: 1, title: 'Eid al-Fitr', description: 'The celebration marking the end of Ramadan. Check with your masjid for Eid prayer details.' },
  { month: 12, day: 9, title: 'Day of Arafah', description: 'Pilgrims gather at Arafah during Hajj.' },
  { month: 12, day: 10, title: 'Eid al-Adha', description: 'The Festival of Sacrifice during the Hajj season. Check with your masjid for Eid prayer details.' },
]

const hijriNumber = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', month: 'numeric', day: 'numeric' })
const dateKey = (day: number) => new Date(day).toISOString().slice(0, 10)

function getObservance(day: number, offset: number) {
  const parts = hijriNumber.formatToParts(day + offset * DAY)
  const month = Number(parts.find(part => part.type === 'month')?.value)
  const date = Number(parts.find(part => part.type === 'day')?.value)
  return observances.find(item => item.month === month && item.day === date)
}

const hijri = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
const gregorian = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
const gregorianMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', month: 'long', year: 'numeric' })
const gregorianMonths = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', month: 'long' }).format(new Date(Date.UTC(2024, month, 1))))

// Represent local calendar dates at UTC midnight so daylight saving never skips a grid cell.
function localDay(now: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone || undefined, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now)
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'))
}

function hijriPart(day: number, offset: number, type: string) {
  return hijri.formatToParts(day + offset * DAY).find(part => part.type === type)?.value ?? ''
}

function monthBounds(anchor: number, isHijri: boolean, offset: number) {
  const date = new Date(anchor)
  if (!isHijri) {
    return { start: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1), end: Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) }
  }
  const start = anchor - (Number(hijriPart(anchor, offset, 'day')) - 1) * DAY
  const day30 = start + 29 * DAY
  return { start, end: day30 + (hijriPart(day30, offset, 'day') === '1' ? 0 : DAY) }
}

export function Calendar({ events, masjidLocations }: {
  events: CommunityEvent[]
  masjidLocations: Record<string, { lat: number; lng: number } | null>
}) {
  const [now, setNow] = useState<Date | null>(null)
  const [city, setCity] = useState('')
  const [place, setPlace] = useState<Place | null>(defaultPlace)
  const [holidayResult, setHolidayResult] = useState<{ key: string; holidays: Holiday[]; incomplete: boolean } | null>(null)
  const [prayers, setPrayers] = useState<{ key: string; times: PrayerTimes | null } | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteDraft, setNoteDraft] = useState('')
  const [notesReady, setNotesReady] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({ Holiday: true, Islamic: true, Masjid: true, Note: true })
  const [preferencesReady, setPreferencesReady] = useState(false)
  const [cityError, setCityError] = useState('')
  const [searching, setSearching] = useState(false)
  const [zone, setZone] = useState('America/Toronto')
  const [zones, setZones] = useState<string[]>([])
  const [anchor, setAnchor] = useState<number | null>(null)
  const [isHijri, setIsHijri] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setNow(new Date())
    setZones(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['America/Toronto', 'Europe/London', 'Asia/Riyadh', 'Asia/Karachi', 'Asia/Jakarta', 'UTC'])
    const timer = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('masjid-link-calendar-notes-v1')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) setNotes(parsed as Record<string, string>)
      }
    } catch {
      // Keep the calendar usable if browser storage is unavailable or malformed.
    }
    setNotesReady(true)
  }, [])

  useEffect(() => {
    if (!notesReady) return
    try {
      window.localStorage.setItem('masjid-link-calendar-notes-v1', JSON.stringify(notes))
    } catch {
      // Notes remain editable for the current session if storage is unavailable.
    }
  }, [notes, notesReady])

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('masjid-link-calendar-theme-v1') === 'dark')
      const savedFilters = window.localStorage.getItem('masjid-link-calendar-filters-v1')
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) setFilters(current => ({ ...current, ...parsed }))
      }
    } catch {
      // Use defaults if saved preferences are unavailable.
    }
    setPreferencesReady(true)
  }, [])

  useEffect(() => {
    if (!preferencesReady) return
    try {
      window.localStorage.setItem('masjid-link-calendar-theme-v1', darkMode ? 'dark' : 'light')
      window.localStorage.setItem('masjid-link-calendar-filters-v1', JSON.stringify(filters))
    } catch {
      // Preferences remain available for this session if storage is unavailable.
    }
  }, [darkMode, filters, preferencesReady])

  async function selectCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = city.trim()
    if (!query || searching) return

    setSearching(true)
    setCityError('')
    try {
      const response = await fetch(`/api/calendar/location?city=${encodeURIComponent(query)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setZone(result.zone)
      setPlace(result)
      setSelectedDay(null)
      setAnchor(null)
    } catch (error) {
      setCityError(error instanceof Error && error.message
        ? error.message
        : 'Could not look up the city. Try again.')
    } finally {
      setSearching(false)
    }
  }

  const localTime = now ? new Intl.DateTimeFormat('en-CA', {
    timeZone: zone || undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(now) : null

  const today = now ? localDay(now, zone) : null
  const bounds = today === null ? null : monthBounds(anchor ?? today, isHijri, offset)
  const days = bounds ? Array.from({ length: (bounds.end - bounds.start) / DAY }, (_, index) => bounds.start + index * DAY) : []
  const title = bounds ? isHijri
    ? `${hijriPart(bounds.start, offset, 'month')} ${hijriPart(bounds.start, offset, 'year')} AH`
    : gregorianMonth.format(bounds.start)
    : 'Loading calendar…'
  const calendarYear = bounds ? new Date(bounds.start).getUTCFullYear() : 0
  const calendarMonth = bounds ? new Date(bounds.start).getUTCMonth() : 0
  const yearOptions = bounds ? Array.from({ length: 21 }, (_, index) => calendarYear - 10 + index) : []

  const year = bounds ? new Date(bounds.start).getUTCFullYear() : 0
  const endYear = bounds ? new Date(bounds.end - DAY).getUTCFullYear() : 0
  const country = place?.country
  const region = place?.region
  const holidayKey = `${country}:${region}:${year}:${endYear}`
  const lat = place?.lat
  const lng = place?.lng
  const prayerKey = `${lat}:${lng}:${today}`

  useEffect(() => {
    if (!country || !year) return
    const controller = new AbortController()
    const years = year === endYear ? [year] : [year, endYear]
    void Promise.allSettled(years.map(async value => {
      const params = new URLSearchParams({ country, year: String(value) })
      if (region) params.set('region', region)
      const response = await fetch(`/api/calendar/holidays?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Holiday data unavailable')
      return (await response.json()).holidays as Holiday[]
    })).then(results => {
      if (controller.signal.aborted) return
      setHolidayResult({
        key: holidayKey,
        holidays: results.flatMap(result => result.status === 'fulfilled' ? result.value : []),
        incomplete: results.some(result => result.status === 'rejected'),
      })
    })
    return () => controller.abort()
  }, [country, region, year, endYear, holidayKey])

  useEffect(() => {
    if (lat === undefined || lng === undefined || today === null) return
    const controller = new AbortController()
    fetch(`/api/prayer-times?lat=${lat}&lng=${lng}`, { signal: controller.signal })
      .then(async response => response.ok ? (await response.json()).prayerTimes as PrayerTimes : null)
      .then(times => {
        if (!controller.signal.aborted) setPrayers({ key: prayerKey, times })
      })
      .catch(() => {
        if (!controller.signal.aborted) setPrayers({ key: prayerKey, times: null })
      })
    return () => controller.abort()
  }, [lat, lng, today, prayerKey])

  const holidayData = holidayResult?.key === holidayKey ? holidayResult : null
  const monthHolidays = bounds ? (holidayData?.holidays ?? []).filter(holiday =>
    holiday.date >= dateKey(bounds.start) && holiday.date < dateKey(bounds.end))
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)) : []
  const times = prayers?.key === prayerKey ? prayers.times : null
  const nextPrayer = times && now ? getNextPrayer(times, now) : null
  const upcoming = useMemo(() => {
    if (today === null) return []
    const items = []
    for (let index = 0; index < 370 && items.length < 3; index++) {
      const day = today + index * DAY
      const event = getObservance(day, offset)
      if (event) items.push({ ...event, date: day })
    }
    return items
  }, [today, offset])

  const cityName = place?.city.trim().toLowerCase()
  const cityEvents = useMemo(() => {
    if (lat === undefined || lng === undefined) return []
    return events.filter(event => {
      const masjid = masjidLocations[event.masjidId]
      return masjid
        ? haversineKm(lat, lng, masjid.lat, masjid.lng) <= 25
        : Boolean(cityName && event.location.toLowerCase().split(',').some(part => part.trim() === cityName))
    })
  }, [lat, lng, cityName, events, masjidLocations])
  const upcomingCommunity = today === null ? [] : cityEvents.filter(event => event.date >= dateKey(today)).slice(0, 6)
  const activeDay = bounds && selectedDay !== null && selectedDay >= bounds.start && selectedDay < bounds.end
    ? selectedDay : bounds && today !== null && today >= bounds.start && today < bounds.end ? today : bounds?.start
  useEffect(() => {
    if (activeDay !== undefined) setNoteDraft(notes[dateKey(activeDay)] ?? '')
  }, [activeDay, notes])
  const categoryFor = (item: { type: string }): FilterKey => item.type === 'Islamic observance'
    ? 'Islamic' : item.type === 'Masjid event' ? 'Masjid' : item.type === 'Personal note' ? 'Note' : 'Holiday'
  const entries = (day: number) => {
    const key = dateKey(day)
    const observance = getObservance(day, offset)
    return [
      ...(observance ? [{ name: observance.title, type: 'Islamic observance', detail: observance.description }] : []),
      ...(holidayData?.holidays ?? []).filter(holiday => holiday.date === key)
        .map(holiday => ({ name: holiday.name, type: `${holiday.scope} holiday`, detail: '' })),
      ...cityEvents.filter(event => event.date === key)
        .map(event => ({ name: event.title, type: 'Masjid event', detail: event.location, href: `/events/${event.id}` })),
    ]
  }

  const displayEntries = (day: number) => {
    const visible = entries(day).filter(item => filters[categoryFor(item)])
    const note = (notes[dateKey(day)] ?? '').trim()
    if (!filters.Note || !note) return visible
    const preview = note.length > 36 ? note.slice(0, 36).trimEnd() + '…' : note
    return [...visible, { name: preview, type: 'Personal note', detail: 'Saved in this browser' }]
  }

  return (
    <div className={'mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ' + (darkMode ? 'dark calendar-dark' : '')}>
      <section className="relative overflow-hidden rounded-3xl border border-indigo-900 bg-linear-to-br from-[#102856] via-[#233773] to-[#075b62] px-5 py-8 text-white shadow-lg sm:p-10">
        <GeometricPattern className="pointer-events-none absolute -right-10 -top-12 size-80 text-white/10" />
        <div className="relative">
          <h1 className="text-sm font-semibold uppercase tracking-widest text-mint">Hijri &amp; Gregorian Calendar</h1>
          <p className="mt-3 text-3xl font-extrabold sm:text-5xl">{today === null ? 'Loading date…' : hijri.format(today + offset * DAY)}</p>
          {today !== null && <p className="mt-2 text-white/80">{gregorian.format(today)} · {place?.label ?? 'Selected time zone'}</p>}
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-sky-300/40 bg-sky-300/15 p-4"><dt className="text-sm text-white/90">Local time</dt><dd className="mt-1 font-semibold tabular-nums">{localTime ?? '—'}</dd></div>
            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-300/15 p-4"><dt className="text-sm text-white/90">Next prayer</dt><dd className="mt-1 font-semibold">{nextPrayer ? `${nextPrayer.label} · ${formatCountdown(nextPrayer.minutesUntil)}` : '—'}</dd></div>
            <div className="rounded-2xl border border-amber-300/40 bg-amber-300/15 p-4"><dt className="text-sm text-white/90">Next Islamic observance</dt><dd className="mt-1 font-semibold">{upcoming[0] ? `${upcoming[0].title} · ${gregorian.format(upcoming[0].date)}` : '—'}</dd></div>
          </dl>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-300 bg-white p-3 shadow-lg shadow-slate-200/60 sm:p-7 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="calendar-month">
        <form onSubmit={selectCity} className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 basis-48 font-semibold">City
            <input className={inputClass} value={city} onChange={event => setCity(event.target.value)}
              placeholder="Toronto, Canada" required maxLength={120} disabled={searching} />
          </label>
          <button className={secondaryButton} type="submit" disabled={searching}>{searching ? 'Finding city…' : 'Set city'}</button>
        </form>
        {cityError && <p role="alert" className="mt-2 text-sm text-destructive">{cityError}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="font-semibold">Location time zone
            <select className={inputClass} value={zone} disabled={searching} onChange={event => {
              setZone(event.target.value); setPlace(null); setCityError(''); setAnchor(null); setSelectedDay(null)
            }}>
              <option value="">Device time zone</option>
              {zone && !zones.includes(zone) && <option value={zone}>{zone.replaceAll('_', ' ')}</option>}
              {zones.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="font-semibold">Hijri date adjustment
            <select className={inputClass} value={offset} onChange={event => { setOffset(Number(event.target.value)); setAnchor(null); setSelectedDay(null) }}>
              <option value={0}>Umm al-Qura date</option><option value={-1}>One day earlier</option><option value={1}>One day later</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Calendar view">
          <button type="button" className={`${secondaryButton} aria-pressed:border-indigo-800 aria-pressed:bg-indigo-800 aria-pressed:text-white`} aria-pressed={isHijri} onClick={() => setIsHijri(true)}>Hijri month</button>
          <button type="button" className={`${secondaryButton} aria-pressed:border-indigo-800 aria-pressed:bg-indigo-800 aria-pressed:text-white`} aria-pressed={!isHijri} onClick={() => setIsHijri(false)}>Gregorian month</button>
          <button type="button" className={secondaryButton + ' ml-auto'} aria-pressed={darkMode} aria-label={'Switch to ' + (darkMode ? 'light mode' : 'dark mode')} onClick={() => setDarkMode(value => !value)}>{darkMode ? 'Light mode' : 'Dark mode'}</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="calendar-month" className="text-2xl font-bold text-navy" aria-live="polite">{title}</h2>
          {!isHijri && bounds && <div className="flex gap-2">
            <label className="sr-only" htmlFor="calendar-month-select">Calendar month</label>
            <select id="calendar-month-select" aria-label="Calendar month" className={inputClass + ' w-36'} value={calendarMonth} onChange={event => { setAnchor(Date.UTC(calendarYear, Number(event.target.value), 1)); setSelectedDay(null) }}>
              {gregorianMonths.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <label className="sr-only" htmlFor="calendar-year-select">Calendar year</label>
            <select id="calendar-year-select" aria-label="Calendar year" className={inputClass + ' w-24'} value={calendarYear} onChange={event => { setAnchor(Date.UTC(Number(event.target.value), calendarMonth, 1)); setSelectedDay(null) }}>
              {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>}
          {bounds && <div className="flex flex-wrap gap-2">
            <button className={secondaryButton} onClick={() => { setAnchor(bounds.start - DAY); setSelectedDay(null) }}>Previous</button>
            <button className={secondaryButton} onClick={() => { setAnchor(null); setSelectedDay(null) }}>Today</button>
            <button className={secondaryButton} onClick={() => { setAnchor(bounds.end); setSelectedDay(null) }}>Next</button>
          </div>}
        </div>
        <ul aria-label="Calendar legend" className="mt-4 flex flex-wrap gap-2">
          {Object.values(tileColors).map(({ label, tile, badge }) => (
            <li key={label} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${tile} ${badge}`}>{label}</li>
          ))}
        </ul>
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-semibold text-navy">Show on calendar</legend>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(({ key, label }) => (
              <label key={key} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <input type="checkbox" className="size-4 accent-emerald-600" checked={filters[key]} onChange={() => setFilters(current => ({ ...current, [key]: !current[key] }))} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {bounds && <div className="mt-3 grid grid-cols-7 gap-1 rounded-2xl border border-slate-300 bg-slate-100 p-1 sm:gap-2 sm:p-2 dark:border-slate-700 dark:bg-slate-800">
          {weekdays.map(({ label, colors }) => (
            <div key={label} className={`rounded-lg border px-0.5 py-2 text-center text-xs font-bold ${colors}`}>{label}</div>
          ))}
          {Array.from({ length: new Date(bounds.start).getUTCDay() }, (_, index) => <div key={index} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600" aria-hidden="true" />)}
          {days.map(day => {
            const items = displayEntries(day)
            const types = [...new Set(items.map(item => categoryFor(item)))]
            return <div key={day} className="group relative min-w-0">
              <button type="button" aria-current={day === today ? 'date' : undefined} aria-pressed={day === activeDay}
                aria-label={`${gregorian.format(day)}${items.length ? ': ' + items.map(item => item.name).join(', ') : ''}`}
                onClick={() => setSelectedDay(day)}
                className={`h-full min-h-20 w-full rounded-lg border px-0.5 py-2 text-center transition hover:border-indigo-600 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 sm:min-h-28 sm:px-2 ${types.length ? tileColors[types[0]].tile : 'border-slate-300 bg-white'} ${day === activeDay ? 'ring-2 ring-inset ring-indigo-700' : ''}`}>
                <span className={`mx-auto grid size-6 place-items-center rounded-full font-extrabold ${day === today ? 'bg-indigo-800 text-white' : 'text-navy'}`}>{isHijri ? hijriPart(day, offset, 'day') : new Date(day).getUTCDate()}</span>
                <span className="block truncate text-[10px] text-muted-foreground sm:text-xs">{isHijri ? gregorian.format(day).replace(/,? \d{4}$/, '') : `${hijriPart(day, offset, 'day')} ${hijriPart(day, offset, 'month')}`}</span>
                {types.map(type => <span key={type} className={`mx-0.5 inline-block rounded-full px-0.5 text-[10px] font-bold sm:px-1 ${tileColors[type].badge}`} aria-hidden="true"><span className="sm:hidden">●</span><span className="hidden sm:inline">{type === 'Note' ? 'Note' : type}</span></span>)}
                {items.length > 0 && <span aria-hidden="true" className="mt-1 block space-y-0.5 text-[9px] font-semibold leading-tight text-slate-700 sm:text-xs">{items.map((item, index) => <span key={index} className="block break-words">{item.name}</span>)}</span>}
              </button>
            </div>
          })}
        </div>}
        {activeDay !== undefined && <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50" aria-live="polite">
          <h3 className="font-bold text-navy">{gregorian.format(activeDay)} · {hijri.format(activeDay + offset * DAY)}</h3>
          {entries(activeDay).length ? <ul className="mt-2 space-y-2 text-sm">{entries(activeDay).map((item, index) => <li key={index}>
            <span className="font-semibold text-navy">{'href' in item && typeof item.href === 'string' ? <Link href={item.href} className="underline">{item.name}</Link> : item.name}</span>
            <span className="text-muted-foreground"> · {item.type}{item.detail ? ` · ${item.detail}` : ''}</span>
          </li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">No events or holidays listed for this date.</p>}
          <div className="mt-4 border-t border-indigo-200 pt-4">
            <div className="flex items-center justify-between gap-2"><label htmlFor={`calendar-note-${dateKey(activeDay)}`} className="font-semibold text-navy">Personal notes &amp; reminders</label><span className="text-xs text-muted-foreground">{noteDraft.length}/250</span></div>
            <textarea
              id={`calendar-note-${dateKey(activeDay)}`}
              className={`${inputClass} mt-2 min-h-24 resize-y`}
              value={noteDraft}
              onChange={event => setNoteDraft(event.target.value)}
              maxLength={250}
              placeholder="Add a personal note or reminder for this day…"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} onClick={() => {
                const key = dateKey(activeDay)
                const value = noteDraft.trim()
                setNotes(current => {
                  const updated = { ...current }
                  if (value) updated[key] = value
                  else delete updated[key]
                  return updated
                })
              }}>Save note</button>
              {notes[dateKey(activeDay)] && <button type="button" className={secondaryButton} onClick={() => {
                const key = dateKey(activeDay)
                setNoteDraft('')
                setNotes(current => {
                  const updated = { ...current }
                  delete updated[key]
                  return updated
                })
              }}>Clear note</button>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Saved in this browser for this date.</p>
          </div>
        </div>}
        {filters.Holiday && monthHolidays.length > 0 && <div className="mt-5">
          <h3 className="font-bold text-navy">Public holidays this month</h3>
          <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {monthHolidays.map((holiday, index) => <li key={index} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/40">
              <time dateTime={holiday.date} className="font-semibold text-navy">{gregorian.format(new Date(holiday.date))}</time>
              {' · '}{holiday.name} <span className="text-muted-foreground">({holiday.scope})</span>
            </li>)}
          </ul>
        </div>}
        <p className="mt-4 text-xs text-muted-foreground">Hijri dates use Umm al-Qura and may differ from local moon sightings. Public holidays come from <a className="underline" href="https://nagerholidays.com/">Nager.Date</a> and may omit local or newly gazetted dates.{country && !region ? ' National holidays only for this location.' : ''}</p>
        <p className="mt-2 text-xs text-muted-foreground" role="status">{!country ? 'Set a city with a supported country to see public holidays.' : !holidayData ? 'Loading public holidays…' : holidayData.incomplete ? 'Some public holiday data is unavailable for this location and month.' : ''}</p>
      </section>

      {filters.Islamic && <section aria-labelledby="islamic-events">
        <h2 id="islamic-events" className="text-2xl font-bold text-navy">Upcoming Islamic observances</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {upcoming.map(item => <article key={item.date} className="overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
            <Image src="/images/hero-mosque.png" alt="" width={640} height={240} className="h-28 w-full object-cover" />
            <div className="p-5">
              <time dateTime={dateKey(item.date)} className="text-sm font-semibold text-teal-dark">{gregorian.format(item.date)}</time>
              <h3 className="mt-1 text-lg font-bold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </article>)}
        </div>
      </section>}

      {filters.Masjid && <section aria-labelledby="community-events" className="rounded-2xl border border-violet-300 bg-violet-50 p-5 sm:p-7 dark:border-violet-800 dark:bg-violet-950/40">
        <h2 id="community-events" className="text-2xl font-bold text-navy">Community events{place?.city ? ` near ${place.city}` : ''}</h2>
        {upcomingCommunity.length ? <ul className="mt-4 grid gap-4 sm:grid-cols-2">{upcomingCommunity.map(event => <li key={event.id} className="rounded-xl bg-surface p-4">
          <Link href={`/events/${event.id}`} className="font-bold text-navy underline">{event.title}</Link>
          <p className="mt-1 text-sm text-muted-foreground">{gregorian.format(new Date(event.date))} · {event.startTime} · {event.location}</p>
          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{place ? 'No upcoming masjid events are listed near this city.' : 'Set a city to see local masjid events.'}</p>}
        {place && <Link className="mt-4 inline-block font-semibold text-teal-dark underline" href={`/masjids?lat=${place.lat}&lng=${place.lng}&near=${encodeURIComponent(place.label)}`}>Find nearby masjids</Link>}
      </section>}

      <section aria-labelledby="calendar-prayers" className="rounded-2xl border border-sky-300 bg-sky-50 p-5 sm:p-7 dark:border-sky-800 dark:bg-sky-950/40">
        <h2 id="calendar-prayers" className="text-2xl font-bold text-navy">Today’s prayer times</h2>
        {times ? <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{DAILY_PRAYERS.map(prayer => <div key={prayer.key} className={`rounded-xl border p-3 text-center ${nextPrayer?.key === prayer.key ? 'border-indigo-900 bg-indigo-800 text-white' : 'border-sky-300 bg-white text-navy'}`}>
          <dt className="text-sm font-semibold">{prayer.label}</dt><dd className="mt-1 font-bold tabular-nums">{times[prayer.key]}</dd>
        </div>)}</dl> : <p className="mt-2 text-sm text-muted-foreground">{!place ? 'Set a city to see prayer times.' : prayers?.key === prayerKey ? 'Prayer times are temporarily unavailable.' : 'Loading prayer times…'}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Calculated for the selected city. Check your masjid for congregation times.</p>
      </section>
    </div>
  )
}
