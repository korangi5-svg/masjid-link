'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContext, useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { PasswordField } from '@/components/auth/password-field'
import { SignInRecitationContext } from '@/components/auth/auth-provider'
import { resendSignupConfirmation, signIn } from '@/lib/services/auth'
import { firebaseSignupEnabled, resendFirebaseConfirmation } from '@/lib/services/firebase-auth'
import { focusRing, primaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { hasErrors, validateEmail, type FieldErrors } from '@/lib/validation'

export function LoginForm() {
  const router = useRouter()
  const playRecitation = useContext(SignInRecitationContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [resending, setResending] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')

  async function handleResend() {
    const address = email.trim()
    const error = validateEmail(address)
    setErrors((current) => ({ ...current, email: error }))
    setServerError('')
    setConfirmationMessage('')
    if (error) return

    setResending(true)
    try {
      const firebase = firebaseSignupEnabled && password ? await resendFirebaseConfirmation(address, password) : null
      const result = firebase ?? await resendSignupConfirmation(address)
      if (result.ok) setConfirmationMessage('If this account still needs confirmation, check your inbox for a new link.')
      else setServerError(result.error ?? 'Could not resend the confirmation email.')
    } catch {
      setServerError('Could not connect. Please try again.')
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (resending) return
    setConfirmationMessage('')
    const nextErrors = { email: validateEmail(email), password: password ? undefined : 'Please enter your password.' }
    setErrors(nextErrors)
    setServerError('')
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    const result = await signIn(email.trim(), password, remember)
    setSubmitting(false)
    if (result.ok) {
      playRecitation()
      router.push('/dashboard')
    } else {
      setServerError(result.error ?? 'Unable to log in.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {confirmationMessage && <FormAlert tone="success">{confirmationMessage}</FormAlert>}
      {serverError && <FormAlert tone="error">{serverError}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        maxLength={254}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-input accent-teal"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className={cn('rounded text-sm font-semibold text-teal-dark hover:underline', focusRing)}>
          Forgot password?
        </Link>
      </div>
      <button type="submit" disabled={submitting || resending} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
      <button type="button" onClick={handleResend} disabled={submitting || resending} className={cn('self-start rounded text-sm font-semibold text-teal-dark underline disabled:opacity-70', focusRing)}>
        {resending ? 'Sending…' : 'Resend confirmation email'}
      </button>
    </form>
  )
}

