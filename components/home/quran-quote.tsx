import { GeometricPattern } from '@/components/home/geometric-pattern'

export function QuranQuote() {
  return (
    <section aria-label="Quran 3:103" className="relative overflow-hidden border-t border-border bg-surface">
      <GeometricPattern className="absolute -left-10 -top-10 size-56 text-brand-blue/15 [mask-image:radial-gradient(circle_at_top_left,black_30%,transparent_70%)] sm:size-72" />
      <GeometricPattern className="absolute -bottom-10 -right-10 size-56 text-teal/20 [mask-image:radial-gradient(circle_at_bottom_right,black_30%,transparent_70%)] sm:size-72" />

      <figure className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <blockquote>
          <p className="text-balance font-serif text-2xl italic leading-snug text-navy sm:text-3xl lg:text-[2.15rem]">
            {'“And hold firmly to the rope of Allah all together'}
            <br className="hidden sm:block" /> {'and do not become divided.”'}
          </p>
        </blockquote>
        <figcaption className="mt-5 font-serif text-lg font-semibold text-teal">— Quran 3:103</figcaption>
        <div className="mx-auto mt-8 flex max-w-md items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-navy/15" />
          <span className="size-2 rotate-45 bg-gold" />
          <span className="h-px flex-1 bg-navy/15" />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-[0.25em] text-navy/80 sm:text-sm">
          STRONGER COMMUNITIES <span className="text-teal">•</span> CLOSER TO ALLAH
        </p>
      </figure>
    </section>
  )
}
