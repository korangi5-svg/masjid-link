import Image from 'next/image'
import type { ReactNode } from 'react'
import { HERO_IMAGE } from '@/components/home/hero'

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
      <div className="relative hidden aspect-[4/5] max-h-[620px] overflow-hidden rounded-3xl lg:block">
        <Image src={HERO_IMAGE.src} alt="" fill sizes="50vw" className="object-cover object-[75%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" aria-hidden="true" />
        <figure className="absolute inset-x-0 bottom-0 p-8 text-white">
          <blockquote className="font-serif text-2xl italic leading-snug">
            {'“The believers are but brothers, so make peace between your brothers.”'}
          </blockquote>
          <figcaption className="mt-3 font-serif font-semibold text-mint">— Quran 49:10</figcaption>
        </figure>
      </div>
    </div>
  )
}
