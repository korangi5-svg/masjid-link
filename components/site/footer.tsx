import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { SocialLinks } from '@/components/site/social-links'
import { contactInfo, focusRing, navLinks } from '@/lib/site'
import { cn } from '@/lib/utils'

const resourceLinks = [
  { href: '/resources#quran', label: 'Quran' },
  { href: '/resources#hadith', label: 'Hadith' },
  { href: '/resources#dua', label: 'Dua' },
  { href: '/resources#articles', label: 'Islamic Articles' },
  { href: '/resources#education', label: 'Educational Resources' },
]

const linkClass = cn('rounded text-sm text-white/75 transition-colors hover:text-mint', focusRing, 'focus-visible:ring-offset-navy-deep')

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div className="flex flex-col gap-5">
          <Logo variant="light" />
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            Helping Muslims discover local mosques, join community events, and grow in faith together.
          </p>
          <SocialLinks />
        </div>

        <nav aria-label="Quick links">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mint">Quick Links</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Resources">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mint">Resources</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {resourceLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mint">Contact</h2>
          <ul className="mt-4 flex flex-col gap-4 text-sm text-white/75">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
              <a href={`mailto:${contactInfo.email}`} className={cn(linkClass, 'break-all')}>
                {contactInfo.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
              <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`} className={linkClass}>
                {contactInfo.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
              <span>{contactInfo.address}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/60 sm:px-6 lg:px-8">
          © 2026 Connect to Masjid. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
