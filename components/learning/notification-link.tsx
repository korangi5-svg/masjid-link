'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { parseFollowPreferences, scholarUpdates } from '@/lib/scholar-follow'
import { focusRing } from '@/lib/site'

export function NotificationLink() {
  const { user } = useAuth()
  if (!user) return null
  const prefs = parseFollowPreferences(user.user_metadata?.scholar_notifications)
  const count = prefs.inApp ? scholarUpdates(user.user_metadata?.recommendation_activity, prefs).filter(item => !prefs.read.includes(item.id)).length : 0
  return <Link href="/notifications" aria-label={`Scholar notifications${count ? `, ${count} unread` : ''}`} className={`relative inline-flex size-10 items-center justify-center rounded-full text-navy hover:bg-surface ${focusRing}`}><Bell className="size-5" aria-hidden="true"/>{count > 0 && <span className="absolute -right-1 top-0 rounded-full bg-teal px-1.5 text-xs font-bold text-white">{count}</span>}</Link>
}
