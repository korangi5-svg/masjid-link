'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { PasswordField } from '@/components/auth/password-field'
import { signIn } from '@/lib/services/auth'
import { focusRing, primaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { hasErrors, validateEmail, type FieldErrors } from '@/lib/validation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = { email: validateEmail(email), password: password ? undefined : 'Please enter your password.' }
    setErrors(nextErrors)
    setServerError('')
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    const result = await signIn(email.trim(), password, remember)
    setSubmitting(false)
    if (result.ok) router.push('/account')
    else setServerError(result.error ?? 'Unable to log in.')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
      <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}
