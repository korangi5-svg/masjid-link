export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading masjid…
      </p>
      <div className="h-4 w-24 rounded bg-surface" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="h-10 w-2/3 rounded bg-surface" />
          <div className="mt-4 h-5 w-1/2 rounded bg-surface" />
          <div className="mt-8 h-20 rounded bg-surface" />
          <div className="mt-6 flex gap-3">
            <div className="h-11 w-40 rounded-full bg-surface" />
            <div className="h-11 w-36 rounded-full bg-surface" />
          </div>
        </div>
        <div className="h-96 rounded-2xl bg-surface" />
      </div>
    </div>
  )
}
