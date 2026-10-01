import Image from 'next/image'
import { LocationSearch } from '@/components/home/location-search'

export const HERO_IMAGE = {
  src: '/images/hero-mosque.png',
  alt: 'A large white mosque with domes and minarets at sunset, surrounded by green lawns',
}

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-navy">
      <Image
        src={HERO_IMAGE.src}
        alt={HERO_IMAGE.alt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/95 via-navy/75 to-navy/0 max-md:via-navy/80 max-md:to-navy/40"
      />

      <div className="mx-auto flex min-h-[470px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-[600px]">
          <h1
            id="hero-heading"
            className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[64px]"
          >
            Find Your Masjid.
            <span className="block text-mint">Stay Connected.</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-pretty text-base leading-relaxed text-white/90 sm:text-lg">
            Find masjids near any address or your current location, anywhere in the world, with today’s prayer times
            for your area.
          </p>
          <LocationSearch />
        </div>
      </div>
    </section>
  )
}
