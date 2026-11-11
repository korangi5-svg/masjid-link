import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { loadWeeklyCommunity } from '@/lib/weekly-engagement'
import { ScholarNotifications } from '@/components/learning/scholar-notifications'
import { DailyLearningReminder } from '@/components/learning/daily-learning'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Scholar updates & digest | Masjid Link' }
const loadCommunity = unstable_cache(async () => {
  const db = getSupabaseAdmin()
  if (!db) return null
  return loadWeeklyCommunity(db, Date.now())
}, ['weekly-engagement-community'], { revalidate: 3600 })

export default async function NotificationsPage() {
  const community = await loadCommunity().catch(() => null)
  const emailReady = Boolean(process.env.RESEND_API_KEY && process.env.SCHOLAR_FROM_EMAIL && process.env.CRON_SECRET && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NEXT_PUBLIC_SUPABASE_URL)
  return <><div className="mx-auto max-w-6xl px-4"><DailyLearningReminder /></div><ScholarNotifications emailReady={emailReady} community={community} /></>
}
