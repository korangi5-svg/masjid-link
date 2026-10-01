import { eventsEnabled } from '@/lib/features'

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/masjids', label: 'Masjids' },
  { href: '/events', label: 'Events' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
].filter((link) => eventsEnabled || link.href !== '/events')

export function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export const contactInfo = {
  email: 'mohammad.arifkhan@outlook.com',
  phone: '(416) 939-5525',
  address: 'Toronto, Ontario, Canada',
}

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2'

export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`

export const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-teal hover:text-teal ${focusRing}`

export const inputClass =
  'block w-full rounded-lg border border-input bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm'
