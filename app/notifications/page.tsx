import { ScholarNotifications } from '@/components/learning/scholar-notifications'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Scholar updates & digest | Masjid Link' }
export default function NotificationsPage() {
  const emailReady = Boolean(process.env.RESEND_API_KEY && process.env.SCHOLAR_FROM_EMAIL && process.env.CRON_SECRET && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NEXT_PUBLIC_SUPABASE_URL)
  return <ScholarNotifications emailReady={emailReady} />
}
