'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleUserRound, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { signOut } from '@/lib/services/auth'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

const pill =
  'inline-flex size-11 items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue sm:size-auto sm:px-5 sm:py-3'

export function AccountMenu() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  // Reserve the space while the session loads so the header doesn't jump.
  if (loading) return <span className="inline-block h-11 w-11 sm:w-36" aria-hidden="true" />

  if (!user) {
    return (
      <Link href="/login" className={cn(pill, focusRing)}>
        <UserRound className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Login / Sign Up</span>
      </Link>
    )
  }

  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim()
  const firstName = fullName?.split(/\s+/)[0] || 'Account'
  const initial = (fullName || user.email || '?').charAt(0).toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(pill, 'sm:pl-2', focusRing)}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-mint text-sm font-bold text-navy" aria-hidden="true">
          {initial}
        </span>
        <span className="sr-only sm:not-sr-only">{firstName}</span>
        <span className="sr-only">— account menu</span>
      </button>

      <div
        id={menuId}
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-white p-2 shadow-lg"
      >
        <p className="px-3 py-2 text-sm">
          <span className="block text-muted-foreground">Signed in as</span>
          <span className="block truncate font-semibold text-navy">{user.email}</span>
        </p>
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface', focusRing)}
        >
          <CircleUserRound className="size-4" aria-hidden="true" /> My dashboard
        </Link>
        <Link
          href="/account"
          onClick={() => setOpen(false)}
          className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface', focusRing)}
        >
          <CircleUserRound className="size-4" aria-hidden="true" /> My account
        </Link>
        <Link href="/scholars" onClick={() => setOpen(false)} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface', focusRing)}>Followed scholars</Link>
        <Link href="/notifications" onClick={() => setOpen(false)} className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface', focusRing)}>Notifications & weekly digest</Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface', focusRing)}
        >
          <LogOut className="size-4" aria-hidden="true" /> Log out
        </button>
      </div>
    </div>
  )
}

