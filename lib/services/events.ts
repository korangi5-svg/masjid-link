import { mockEvents } from '@/lib/data/events'
import { getSupabase } from '@/lib/supabase'
import type { CommunityEvent } from '@/lib/types'

interface EventRow {
  id: string
  title: string
  category: CommunityEvent['category']
  date: string
  start_time: string
  end_time: string
  location: string
  masjid_id: string
  description: string
  details: string
}

function toEvent(row: EventRow): CommunityEvent {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    masjidId: row.masjid_id,
    description: row.description,
    details: row.details,
  }
}

// With Supabase connected, its events are the source of truth (even when empty); sample data is only for unconfigured previews.
export async function getEvents(): Promise<CommunityEvent[]> {
  const supabase = getSupabase()
  if (!supabase) return [...mockEvents].sort((a, b) => a.date.localeCompare(b.date))

  const { data, error } = await supabase.from('events').select('*').order('date')
  if (error) {
    console.error('[events] Supabase read failed:', error.message)
    return []
  }
  return (data as EventRow[]).map(toEvent)
}

export async function getEventById(id: string): Promise<CommunityEvent | null> {
  const supabase = getSupabase()
  if (!supabase) return mockEvents.find((e) => e.id === id) ?? null

  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  if (error) console.error('[events] Supabase read failed:', error.message)
  return data ? toEvent(data as EventRow) : null
}

export { formatEventDate } from '@/lib/services/event-format'
