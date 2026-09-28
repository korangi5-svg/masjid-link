import { useId } from 'react'
import { cn } from '@/lib/utils'

export function GeometricPattern({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={cn('pointer-events-none', className)} viewBox="0 0 240 240">
      <defs>
        <pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="12" y="12" width="36" height="36" />
            <rect x="12" y="12" width="36" height="36" transform="rotate(45 30 30)" />
            <circle cx="30" cy="30" r="8" />
            <path d="M0 0l12 12M60 0L48 12M0 60l12-12M60 60L48 48" />
          </g>
        </pattern>
      </defs>
      <rect width="240" height="240" fill={`url(#${id})`} />
    </svg>
  )
}
