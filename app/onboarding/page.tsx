import type { Metadata } from 'next'
import { OnboardingPage } from '@/components/auth/onboarding-page'

export const metadata: Metadata = { title: 'Choose Your Interests', robots: { index: false } }
export default function Page() { return <OnboardingPage /> }
