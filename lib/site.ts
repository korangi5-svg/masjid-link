import { eventsEnabled } from '@/lib/features'

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/masjids', label: 'Masjids' },
  { href: '/local-services', label: 'Local Services' },
  { href: '/events', label: 'Events' },
  { href: '/resources', label: 'Resources' },
  { href: '/islamic-websites', label: 'Islamic Websites' },
  { href: '/daily-learning', label: 'Daily Learning' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
].filter((link) => eventsEnabled || link.href !== '/events')

const navButtonColors: Record<string, string> = {
  '/': 'bg-[#E0F5EC] text-[#12634F] border-[#B0E8D6]',
  '/masjids': 'bg-[#E1F1FF] text-[#174B78] border-[#B9DAF5]',
  '/local-services': 'bg-[#DCF7EF] text-[#12634F] border-[#B0E8D6]',
  '/events': 'bg-[#FFE8EE] text-[#8A2946] border-[#F7C2D1]',
  '/resources': 'bg-[#FFF1D3] text-[#77500D] border-[#F1D59A]',
  '/islamic-websites': 'bg-[#EFE7FF] text-[#563592] border-[#D9C8FA]',
  '/daily-learning': 'bg-[#FFECDD] text-[#853D14] border-[#F6CBAB]',
  '/calendar': 'bg-[#E5ECFF] text-[#314B93] border-[#C6D3F8]',
  '/about': 'bg-[#E8F3D9] text-[#416022] border-[#CBDFB0]',
  '/contact': 'bg-[#DFF4F8] text-[#17586B] border-[#B5E1EA]',
  '/search': 'bg-[#E1F1FF] text-[#174B78] border-[#B9DAF5]',
  '/notifications': 'bg-[#EFE7FF] text-[#563592] border-[#D9C8FA]',
}

export function navButtonColor(href: string, active: boolean) {
  return active ? 'border-[#087354] bg-[#087354] text-white' : navButtonColors[href]
}

export const navButton =
  'flex min-h-11 items-center justify-center rounded-[10px] border px-3 py-2 text-center text-sm font-semibold leading-tight transition-colors hover:brightness-95'

export function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export const contactInfo = {
  email: 'mohammad.arifkhan10@outlook.com',
  phone: '(416) 939-5525',
  address: 'Toronto, Ontario, Canada',
}

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2'

export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`

export const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-teal hover:text-teal ${focusRing}`

export const inputClass =
  'block w-full rounded-lg border border-input bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm'
