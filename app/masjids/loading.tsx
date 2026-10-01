import { PageHeader } from '@/components/site/page-header'
import { MasjidCardSkeleton } from '@/components/masjids/masjid-card'

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Masjid Directory"
        title="Find a masjid near you"
        description="Searching OpenStreetMap for masjids near you. This can take a few seconds."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
        <p className="sr-only" role="status">
          Loading masjids…
        </p>
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-10 h-80 animate-pulse rounded-2xl bg-surface sm:h-[28rem]" />
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <MasjidCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
