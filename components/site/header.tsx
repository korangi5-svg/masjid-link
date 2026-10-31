'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AccountMenu } from '@/components/auth/account-menu'
import { Logo } from '@/components/site/logo'
import { MobileMenu } from '@/components/site/mobile-menu'
import { accountsEnabled } from '@/lib/features'
import { focusRing, isActivePath, navLinks } from '@/lib/site'
import { cn } from '@/lib/utils'
import { NotificationLink } from '@/components/learning/notification-link'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[105px] lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-3">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex h-[105px] items-center px-3 text-[0.95rem] font-medium transition-colors',
                      'after:absolute after:inset-x-3 after:bottom-7 after:h-[3px] after:rounded-full after:transition-colors',
                      active ? 'text-teal-dark after:bg-teal' : 'text-navy hover:text-teal after:bg-transparent',
                      focusRing,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {accountsEnabled ? <NotificationLink /> : null}
          {accountsEnabled ? <AccountMenu /> : null}
          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </header>
  )
}

