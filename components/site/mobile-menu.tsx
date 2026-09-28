'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { focusRing, isActivePath as isActive, navLinks } from '@/lib/site'
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
    <div className="lg:hidden">
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
        className="absolute inset-x-0 top-full border-b border-border bg-white shadow-lg"
      >
        <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center border-l-4 px-4 py-3.5 text-base font-medium transition-colors',
                    active ? 'border-teal bg-surface text-teal' : 'border-transparent text-navy hover:bg-surface',
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
