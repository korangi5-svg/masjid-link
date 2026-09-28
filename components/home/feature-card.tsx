import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export interface FeatureCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  href: string
  color: string
}

export function FeatureCard({ icon: Icon, title, description, href, color }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className={cn('group flex h-full flex-col items-center px-6 py-10 text-center transition-colors hover:bg-surface', focusRing, 'focus-visible:ring-inset')}
    >
      <span className={cn('flex size-16 items-center justify-center rounded-full text-white shadow-md', color)}>
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-navy group-hover:text-teal">{title}</h2>
      <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  )
}
