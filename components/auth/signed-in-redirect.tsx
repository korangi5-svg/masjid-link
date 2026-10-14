'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'

/** Sends people who are already logged in from the login and sign-up pages to their account. */
export function SignedInRedirect() {
  const { user } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (user) router.replace('/account')
  }, [user, router])
  return null
}
