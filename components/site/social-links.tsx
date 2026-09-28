import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/site'

const socials = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M14 8.5V6.8c0-.8.5-1 1-1h2V2.2h-2.8C11.1 2.2 10.4 4.4 10.4 6v2.5H8V12h2.4v9.8H14V12h2.7l.4-3.5H14z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM20.8 8c-.1-1.5-.4-2.8-1.5-3.9S17 2.6 15.5 2.6C14 2.5 10 2.5 8.5 2.6 7 2.7 5.7 3 4.6 4.1S3.1 6.5 3 8C3 9.5 3 14.5 3 16c.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.5.1 5.6.1 7.1 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.5.1-6.5-.1-8zm-1.9 9.6a3 3 0 0 1-1.7 1.7c-1.2.5-3.9.4-5.2.4s-4 .1-5.2-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-3.9-.4-5.2s-.1-4 .4-5.2a3 3 0 0 1 1.7-1.7c1.2-.5 3.9-.4 5.2-.4s4-.1 5.2.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 3.9.4 5.2s.1 4-.4 5.2z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z',
  },
  {
    label: 'X',
    href: 'https://x.com',
    path: 'M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5z',
  },
]

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn('flex items-center gap-3', className)}>
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-teal',
              focusRing,
              'focus-visible:ring-offset-navy',
            )}
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
            <span className="sr-only">Connect to Masjid on {s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
