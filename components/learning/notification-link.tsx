'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { parseFollowPreferences, scholarUpdates } from '@/lib/scholar-follow'
import { focusRing, navButton, navButtonColor } from '@/lib/site'
import { cn } from '@/lib/utils'

export function NotificationLink() {
  const { user } = useAuth()
  const active = usePathname() === '/notifications'
  if (!user) return null
  const prefs = parseFollowPreferences(user.user_metadata?.scholar_notifications)
  const count = prefs.inApp ? scholarUpdates(user.user_metadata?.recommendation_activity, prefs).filter(item => !prefs.read.includes(item.id)).length : 0
  return (
    <Link
      href="/notifications"
      aria-label={`Scholar notifications${count ? `, ${count} unread` : ''}`}
      aria-current={active ? 'page' : undefined}
      className={cn(navButton, 'relative size-11 p-0', navButtonColor('/notifications', active), focusRing)}
    >
      <Bell className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-1 top-0 rounded-full bg-teal px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
