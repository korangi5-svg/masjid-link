import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset the password for your Connect to Masjid account.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <Link href="/login" className={cn('rounded font-semibold text-teal hover:underline', focusRing)}>
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
