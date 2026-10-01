import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignupForm } from '@/components/auth/signup-form'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free Connect to Masjid account.',
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Join your community — it's free and takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className={cn('rounded font-semibold text-teal-dark hover:underline', focusRing)}>
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
