'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { PasswordField } from '@/components/auth/password-field'
import { signUp } from '@/lib/services/auth'
import { primaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { hasErrors, validateEmail, validatePassword, validateRequired, type FieldErrors } from '@/lib/validation'

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'location'
type Values = Record<Field, string>
const empty: Values = { fullName: '', email: '', password: '', confirmPassword: '', location: '' }

function validate(v: Values): FieldErrors<Field> {
  return {
    fullName: validateRequired(v.fullName, 'full name', 100),
    email: validateEmail(v.email),
    password: validatePassword(v.password),
    confirmPassword: !v.confirmPassword
      ? 'Please confirm your password.'
      : v.confirmPassword !== v.password
        ? 'Passwords do not match.'
        : undefined,
    location: validateRequired(v.location, 'city or location', 100),
  }
}

export function SignupForm() {
  const router = useRouter()
  const [values, setValues] = useState<Values>(empty)
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const bind = (field: Field) => ({
    value: values[field],
    error: errors[field],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
    },
  })

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setServerError('')
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    const result = await signUp({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      location: values.location.trim(),
    })
    setSubmitting(false)
    if (result.ok) router.push('/')
    else setServerError(result.error ?? 'Unable to create your account.')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert tone="error">{serverError}</FormAlert>}
      <TextField label="Full name" autoComplete="name" maxLength={100} {...bind('fullName')} />
      <TextField label="Email" type="email" autoComplete="email" maxLength={254} {...bind('email')} />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        {...bind('password')}
      />
      <PasswordField label="Confirm password" autoComplete="new-password" {...bind('confirmPassword')} />
      <TextField label="City / Location" autoComplete="address-level2" placeholder="e.g. Toronto, ON" maxLength={100} {...bind('location')} />
      <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
