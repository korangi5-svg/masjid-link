'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { CircleCheck, CircleAlert, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

type AuthState = { user: User | null; loading: boolean }

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

type Notice = { tone: 'success' | 'error'; text: string }

/**
 * Starts Supabase on every page so sign-ins carried in email links (confirm, reset) are picked up
 * wherever they land, and shares the signed-in user with the header.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({ user: null, loading: true })
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    // Read the link's #fragment before Supabase consumes and clears it.
    const linkParams = new URLSearchParams(window.location.hash.slice(1))
    const linkError = linkParams.get('error_description')
    if (linkError) setNotice({ tone: 'error', text: friendlyLinkError(linkParams.get('error_code'), linkError) })

    const supabase = getSupabase()
    if (!supabase) {
      setState({ user: null, loading: false })
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false })
      if (data.session && linkParams.get('type') === 'signup') {
        setNotice({ tone: 'success', text: 'Your email is confirmed and you’re now logged in. Welcome!' })
      }
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, loading: false })
      // A reset link that lands anywhere else still needs the new-password form.
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
        router.replace('/reset-password')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={state}>
      {notice ? <AuthNotice notice={notice} onDismiss={() => setNotice(null)} /> : null}
      {children}
    </AuthContext.Provider>
  )
}

function friendlyLinkError(code: string | null, fallback: string) {
  if (code === 'otp_expired') return 'That email link has expired or was already used. Log in, or request a new link.'
  return fallback.replace(/\+/g, ' ')
}

function AuthNotice({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const Icon = notice.tone === 'success' ? CircleCheck : CircleAlert
  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'relative z-[60] flex items-center justify-center gap-2 px-10 py-3 text-center text-sm font-medium',
        notice.tone === 'success' ? 'bg-accent text-teal-dark' : 'bg-destructive/10 text-destructive',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {notice.text}
      <button
        type="button"
        onClick={onDismiss}
        className={cn('absolute right-3 rounded p-1 hover:bg-black/5', focusRing)}
        aria-label="Dismiss"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
