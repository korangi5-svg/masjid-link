import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Choose a New Password',
  description: 'Set a new password for your Connect to Masjid account.',
  robots: { index: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Enter a new password for your account."
      footer={
        <Link href="/login" className={cn('rounded font-semibold text-teal-dark hover:underline', focusRing)}>
          Back to log in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
