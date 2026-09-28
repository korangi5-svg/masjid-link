'use client'

import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { requestPasswordReset } from '@/lib/services/auth'
import { primaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { validateEmail } from '@/lib/validation'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [serverError, setServerError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const emailError = validateEmail(email)
    setError(emailError)
    setServerError('')
    if (emailError) return

    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (result.ok) setSent(true)
    else setServerError(result.error ?? 'Unable to send reset email.')
  }

  if (sent) {
    return (
      <FormAlert tone="success">
        If an account exists for <strong>{email.trim()}</strong>, a password reset link is on its way.
      </FormAlert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert tone="error">{serverError}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (error) setError(undefined)
        }}
        error={error}
        maxLength={254}
      />
      <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
