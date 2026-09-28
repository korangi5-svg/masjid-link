import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { MasjidDirectory } from '@/components/masjids/masjid-directory'
import { getMasjids } from '@/lib/services/masjids'

export const metadata: Metadata = {
  title: 'Find a Masjid',
  description: 'Search mosques near you by city, postal code, or name, and view prayer times and services.',
}

export default async function MasjidsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, masjids] = await Promise.all([searchParams, getMasjids()])

  return (
    <>
      <PageHeader
        eyebrow="Masjid Directory"
        title="Find a masjid near you"
        description="Search by city, postal code, or masjid name. View prayer times, services, and directions."
      />
      <MasjidDirectory masjids={masjids} initialQuery={typeof q === 'string' ? q.slice(0, 100) : ''} />
    </>
  )
}
