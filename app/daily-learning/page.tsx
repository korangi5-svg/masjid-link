import { DailyLearning } from '@/components/learning/daily-learning'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Daily Islamic Learning', description: 'A daily Quran verse, hadith, dua, reflection, and short practical lesson.' }
export default function DailyLearningPage() {
  const emailReady = Boolean(process.env.RESEND_API_KEY && (process.env.DAILY_FROM_EMAIL || process.env.SCHOLAR_FROM_EMAIL) && process.env.CRON_SECRET && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NEXT_PUBLIC_SUPABASE_URL)
  return <DailyLearning emailReady={emailReady}/>
}
