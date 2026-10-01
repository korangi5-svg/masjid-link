import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { MasjidDirectory } from '@/components/masjids/masjid-directory'
import { isValidCoord } from '@/lib/geo'
import { LocationNotFoundError, searchMasjidsNearby } from '@/lib/services/masjids'
import type { Masjid } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Find a Masjid',
  description: 'Search live mosque listings near you by address, city, postal code, or your current location.',
}

export const dynamic = 'force-dynamic'

export default async function MasjidsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lat?: string; lng?: string; r?: string; near?: string }>
}) {
  const { q, lat: latRaw, lng: lngRaw, r, near } = await searchParams
  const radiusKm = [5, 10, 15, 25].includes(Number(r)) ? Number(r) : 15
  const query = typeof q === 'string' ? q.slice(0, 100).trim() : ''
  const lat = latRaw ? Number(latRaw) : undefined
  const lng = lngRaw ? Number(lngRaw) : undefined
  const coords = lat != null && lng != null && isValidCoord(lat, lng) ? { lat, lng } : null
  let masjids: Masjid[] = []
  let origin: { lat: number; lng: number; label?: string } | null = coords

  if (query || coords) {
    try {
      const result = await searchMasjidsNearby({
        location: coords ? undefined : query,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm,
      })
      masjids = result.masjids
      origin = result.origin
    } catch (error) {
      if (!(error instanceof LocationNotFoundError)) {
        console.error('[masjids page]', error)
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Masjid Directory"
        title="Find a masjid near you"
        description="Search mosques near any address, city or postal code, or your current location, and see today’s prayer times for the area."
      />
      <MasjidDirectory
        initialMasjids={masjids}
        initialQuery={query}
        initialCoords={coords}
        initialOrigin={origin}
        initialRadius={radiusKm}
        initialPlace={typeof near === 'string' ? near.slice(0, 100) : undefined}
      />
    </>
  )
}
