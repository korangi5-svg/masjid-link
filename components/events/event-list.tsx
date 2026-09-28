'use client'

import { useState } from 'react'
import { CalendarX } from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { CommunityEvent, EventCategory } from '@/lib/types'

const categories: ('All' | EventCategory)[] = ['All', 'Prayer', 'Education', 'Youth', 'Family', 'Community']

export function EventList({ events }: { events: CommunityEvent[] }) {
  const [category, setCategory] = useState<'All' | EventCategory>('All')
  const visible = category === 'All' ? events : events.filter((e) => e.category === category)

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <fieldset>
        <legend className="sr-only">Filter events by category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c === category
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active ? 'border-navy bg-navy text-white' : 'border-border bg-white text-navy hover:border-teal hover:text-teal',
                  focusRing,
                )}
              >
                {c}
              </button>
            )
          })}
        </div>
      </fieldset>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'event' : 'events'}
      </p>

      {visible.length ? (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <li key={e.id}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <CalendarX className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">No events in this category</h2>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon or browse all events.</p>
        </div>
      )}
    </section>
  )
}
