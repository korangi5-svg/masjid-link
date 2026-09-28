import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your Connect to Masjid account.',
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to save masjids, RSVP to events, and stay connected."
      footer={
        <>
          {"Don't have an account? "}
          <Link href="/signup" className={cn('rounded font-semibold text-teal hover:underline', focusRing)}>
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
