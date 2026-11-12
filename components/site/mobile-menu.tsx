'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { focusRing, isActivePath as isActive, navButton, navButtonColor, navLinks } from '@/lib/site'
import { cn } from '@/lib/utils'

export function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  const menuId = useId()

  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        className={cn('flex size-11 items-center justify-center rounded-full text-navy hover:bg-surface', focusRing)}
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </button>

      <nav
        id={menuId}
        aria-label="Mobile"
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-border bg-white shadow-lg"
      >
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    navButton,
                    'h-full',
                    navButtonColor(link.href, active),
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
    </div>
  )
}
