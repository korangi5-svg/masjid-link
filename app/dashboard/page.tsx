import type { Metadata } from 'next'
import { PersonalizedDashboard } from '@/components/dashboard/personalized-dashboard'

export const metadata: Metadata = { title: 'Your Dashboard', description: 'Your personalized Islamic learning feed.', robots: { index: false } }
export default function Page() { return <PersonalizedDashboard /> }
