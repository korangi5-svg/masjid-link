'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AccountMenu } from '@/components/auth/account-menu'
import { Logo } from '@/components/site/logo'
import { MobileMenu } from '@/components/site/mobile-menu'
import { accountsEnabled } from '@/lib/features'
import { focusRing, isActivePath, navButton, navButtonColor, navLinks } from '@/lib/site'
import { cn } from '@/lib/utils'
import { NotificationLink } from '@/components/learning/notification-link'

export function Header() {
  const pathname = usePathname()
  const searchActive = pathname === '/search'
  const searchAndNotifications = (
    <>
      <Link
        href="/search"
        aria-label="Search Masjid Link"
        aria-current={searchActive ? 'page' : undefined}
        className={cn(navButton, 'size-11 shrink-0 p-0', navButtonColor('/search', searchActive), focusRing)}
      >
        <Search className="size-5" aria-hidden="true" />
      </Link>
      {accountsEnabled ? <NotificationLink /> : null}
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[#234D72] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 xl:hidden">{searchAndNotifications}</div>
          {accountsEnabled ? <AccountMenu /> : null}
          <MobileMenu pathname={pathname} />
        </div>
      </div>
      <nav aria-label="Main" className="mx-auto hidden max-w-screen-2xl overflow-x-auto px-4 pt-1 pb-4 xl:block">
        <ul className="mx-auto flex w-max items-center gap-1.5 2xl:gap-2">
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href)
            const isContact = link.href === '/contact'
            return (
              <li key={link.href} className={isContact ? 'flex items-center gap-2' : undefined}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    navButton,
                    'whitespace-nowrap px-2 2xl:px-3',
                    navButtonColor(link.href, active),
                    focusRing,
                  )}
                >
                  {link.label}
                </Link>
                {isContact ? searchAndNotifications : null}
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

