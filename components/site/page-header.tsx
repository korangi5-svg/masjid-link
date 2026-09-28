import { GeometricPattern } from '@/components/home/geometric-pattern'

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <GeometricPattern className="absolute -right-16 -top-16 size-80 text-white/10 [mask-image:radial-gradient(circle_at_top_right,black_25%,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mint">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}
