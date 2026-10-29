'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'

/** Sends signed-in members to their personalized feed (or interest selection). */
export function SignedInRedirect() {
  const { user } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])
  return null
}

