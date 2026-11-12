import Link from 'next/link'
import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/site'

export function MosqueMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M32 6c0 0-2.4 2.2-2.4 4.2 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4C34.4 8.2 32 6 32 6z" fill="#E6A000" />
      <path
        d="M32 14c-8.8 3.6-14 10-14 17.5V34h28v-2.5C46 24 40.8 17.6 32 14z"
        fill="#079B70"
      />
      <rect x="16" y="34" width="32" height="22" rx="1" fill="#063B70" />
      <path d="M28 56V45a4 4 0 0 1 8 0v11z" fill="#FFFFFF" />
      <rect x="6" y="22" width="6" height="34" rx="1" fill="#063B70" />
      <path d="M9 13l3.5 7h-7z" fill="#079B70" />
      <rect x="52" y="22" width="6" height="34" rx="1" fill="#063B70" />
      <path d="M55 13l3.5 7h-7z" fill="#079B70" />
    </svg>
  )
}

export function Logo({ variant = 'dark', className }: { variant?: 'dark' | 'light'; className?: string }) {
  const light = variant === 'light'
  return (
    <Link href="/" className={cn('flex shrink-0 items-center gap-3 rounded-md', focusRing, className)}>
      <MosqueMark className="size-10 shrink-0 md:size-13" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight md:text-[1.4rem]">
          <span className={light ? 'text-white' : 'text-navy'}>Connect to </span>
          <span className={light ? 'text-mint' : 'text-teal'}>Masjid</span>
        </span>
        <span className="mt-1.5 text-[0.55rem] font-bold tracking-[0.28em] md:text-[0.62rem]">
          <span className={light ? 'text-[#8DE5C5]' : 'text-[#087354]'}>PRAY</span>{' '}
          <span className={light ? 'text-white/70' : 'text-navy/60'}>•</span>{' '}
          <span className={light ? 'text-[#FFD77C]' : 'text-[#805300]'}>LEARN</span>{' '}
          <span className={light ? 'text-white/70' : 'text-navy/60'}>•</span>{' '}
          <span className={light ? 'text-[#A9D6FF]' : 'text-[#174B78]'}>CONNECT</span>
        </span>
      </span>
      <span className="sr-only">Connect to Masjid home</span>
    </Link>
  )
}
