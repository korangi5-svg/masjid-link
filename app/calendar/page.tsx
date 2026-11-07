import type { Metadata } from 'next'
import { eventsEnabled } from '@/lib/features'
import { getEvents } from '@/lib/services/events'
import { getMasjidById } from '@/lib/services/masjids'
import { Calendar } from './calendar'

export const metadata: Metadata = {
  title: 'Hijri and Gregorian Calendar',
  description: 'See Hijri and Gregorian dates, local prayer times, Islamic observances, masjid events, and public holidays.',
}

export default async function CalendarPage() {
  const events = eventsEnabled ? await getEvents() : []
  const masjidIds = [...new Set(events.map(event => event.masjidId).filter(Boolean))]
  const locations = await Promise.all(masjidIds.map(async id => {
    const masjid = await getMasjidById(id).catch(() => null)
    return [id, masjid ? { lat: masjid.latitude, lng: masjid.longitude } : null] as const
  }))
  return <Calendar events={events} masjidLocations={Object.fromEntries(locations)} />
}
