import type { Metadata } from 'next'
import { AccountPage } from '@/components/auth/account-page'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Connect to Masjid profile and password.',
  robots: { index: false },
}

export default function Page() {
  return <AccountPage />
}
