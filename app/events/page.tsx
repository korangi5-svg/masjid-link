import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { EventList } from '@/components/events/event-list'
import { getEvents } from '@/lib/services/events'

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description: 'Prayers, classes, youth nights, and community events at masjids near you.',
}

export default async function EventsPage() {
  const events = await getEvents()
  return (
    <>
      <PageHeader
        eyebrow="Community Calendar"
        title="Upcoming events"
        description="Stay informed about prayers, classes, and gatherings happening across local masjids."
      />
      <EventList events={events} />
    </>
  )
}
