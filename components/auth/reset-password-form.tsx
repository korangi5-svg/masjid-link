'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert } from '@/components/forms/form-field'
import { PasswordField } from '@/components/auth/password-field'
import { updatePassword } from '@/lib/services/auth'
import { getSupabase } from '@/lib/supabase'
import { focusRing, primaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { validatePassword } from '@/lib/validation'

type LinkState = 'checking' | 'valid' | 'invalid'

export function ResetPasswordForm() {
  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // The emailed link signs the user in via the URL; getSession waits for Supabase to read it.
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setLinkState('invalid')
      return
    }
    void supabase.auth.getSession().then(({ data }) => setLinkState(data.session ? 'valid' : 'invalid'))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const passwordError = validatePassword(password)
    setError(passwordError)
    setServerError('')
    if (passwordError) return

    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (result.ok) setDone(true)
    else setServerError(result.error ?? 'Unable to update your password.')
  }

  if (linkState === 'checking') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Checking your reset link…
      </p>
    )
  }

  if (linkState === 'invalid') {
    return (
      <FormAlert tone="error">
        This reset link is invalid or has expired.{' '}
        <Link href="/forgot-password" className={cn('rounded font-semibold underline', focusRing)}>
          Request a new one
        </Link>
        .
      </FormAlert>
    )
  }

  if (done) {
    return (
      <FormAlert tone="success">
        Your password has been updated and you’re logged in.{' '}
        <Link href="/" className={cn('rounded font-semibold underline', focusRing)}>
          Go to the home page
        </Link>
        .
      </FormAlert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert tone="error">{serverError}</FormAlert>}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          if (error) setError(undefined)
        }}
        error={error}
        hint="At least 8 characters, with a letter and a number."
      />
      <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  )
}
