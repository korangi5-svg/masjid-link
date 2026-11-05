'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { inputClass, secondaryButton } from '@/lib/site'

const DAY = 86400000
const hijri = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
const gregorian = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
const gregorianMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', month: 'long', year: 'numeric' })

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

export function Calendar() {
  const [now, setNow] = useState<Date | null>(null)
  const [city, setCity] = useState('')
  const [cityLabel, setCityLabel] = useState('')
  const [cityError, setCityError] = useState('')
  const [searching, setSearching] = useState(false)
  const [zone, setZone] = useState('')
  const [zones, setZones] = useState<string[]>([])
  const [anchor, setAnchor] = useState<number | null>(null)
  const [isHijri, setIsHijri] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setNow(new Date())
    setZones(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['America/Toronto', 'Europe/London', 'Asia/Riyadh', 'Asia/Karachi', 'Asia/Jakarta', 'UTC'])
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

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
      setCityLabel(result.label)
      setAnchor(null)
    } catch (error) {
      setCityError(error instanceof Error && error.message
        ? error.message
        : 'Could not look up the city. Try again.')
    } finally {
      setSearching(false)
    }
  }

  const today = now ? localDay(now, zone) : null
  const bounds = today === null ? null : monthBounds(anchor ?? today, isHijri, offset)
  const days = bounds ? Array.from({ length: (bounds.end - bounds.start) / DAY }, (_, index) => bounds.start + index * DAY) : []
  const title = bounds ? isHijri
    ? `${hijriPart(bounds.start, offset, 'month')} ${hijriPart(bounds.start, offset, 'year')} AH`
    : gregorianMonth.format(bounds.start)
    : 'Loading calendar…'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-bold text-navy">Hijri &amp; Gregorian Calendar</h1>
      <form onSubmit={selectCity} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="min-w-52 flex-1 font-semibold">City
          <input className={inputClass} value={city} onChange={event => setCity(event.target.value)}
            placeholder="Toronto, Canada" required maxLength={120} disabled={searching} />
        </label>
        <button className={secondaryButton} type="submit" disabled={searching}>
          {searching ? 'Finding city…' : 'Set city'}
        </button>
      </form>
      <div aria-live="polite" className="mt-2 text-sm">
        {cityError && <p>{cityError}</p>}
        {cityLabel && <p>Calendar location · {cityLabel}</p>}
      </div>
      {today !== null && <p className="mt-3 text-muted-foreground">Today · {hijri.format(today + offset * DAY)} · {gregorian.format(today)}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="font-semibold">Location time zone
          <select className={inputClass} value={zone} disabled={searching} onChange={event => { setZone(event.target.value); setCityLabel(''); setCityError(''); setAnchor(null) }}>
            <option value="">Device time zone{now ? ` (${Intl.DateTimeFormat().resolvedOptions().timeZone})` : ''}</option>
            {zone && !zones.includes(zone) && <option value={zone}>{zone.replaceAll('_', ' ')}</option>}
            {zones.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
        <label className="font-semibold">Hijri date adjustment
          <select className={inputClass} value={offset} onChange={event => { setOffset(Number(event.target.value)); setAnchor(null) }}>
            <option value={0}>Umm al-Qura date</option>
            <option value={-1}>One day earlier</option>
            <option value={1}>One day later</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">The calendar uses your location’s civil date and the Umm al-Qura calculation. Adjust the Hijri date to match your local mosque’s moon-sighting announcement.</p>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Calendar view">
        <button type="button" className={secondaryButton} aria-pressed={isHijri} onClick={() => setIsHijri(true)}>Hijri month</button>
        <button type="button" className={secondaryButton} aria-pressed={!isHijri} onClick={() => setIsHijri(false)}>Gregorian month</button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-navy" aria-live="polite">{title}</h2>
        {bounds && <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} onClick={() => setAnchor(bounds.start - DAY)}>Previous</button>
          <button type="button" className={secondaryButton} onClick={() => setAnchor(null)}>Today</button>
          <button type="button" className={secondaryButton} onClick={() => setAnchor(bounds.end)}>Next</button>
        </div>}
      </div>
      {bounds && <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-xl border border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="bg-surface p-2 text-center text-xs font-semibold sm:text-sm">{day}</div>)}
        {Array.from({ length: new Date(bounds.start).getUTCDay() }, (_, index) => <div key={`empty-${index}`} className="border-t border-border" aria-hidden="true" />)}
        {days.map(day => <div key={day} aria-current={day === today ? 'date' : undefined} className={`min-h-16 border-t border-border p-1.5 sm:p-3 ${day === today ? 'bg-teal/15 ring-1 ring-inset ring-teal' : ''}`}>
          <span className="block font-semibold text-navy">{isHijri ? hijriPart(day, offset, 'day') : new Date(day).getUTCDate()}</span>
          <span className="block text-xs text-muted-foreground">{isHijri ? gregorian.format(day).replace(/,? \d{4}$/, '') : `${hijriPart(day, offset, 'day')} ${hijriPart(day, offset, 'month')}`}</span>
        </div>)}
      </div>}
    </div>
  )
}
