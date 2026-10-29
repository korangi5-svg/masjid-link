'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { PasswordField } from '@/components/auth/password-field'
import { InterestPicker } from '@/components/auth/interest-picker'
import type { Interest } from '@/lib/interests'
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
  const [confirmEmail, setConfirmEmail] = useState('')
  const [choosingInterests, setChoosingInterests] = useState(false)
  const [interests, setInterests] = useState<Interest[]>([])

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
    if (!choosingInterests) { setChoosingInterests(true); return }
    if (!interests.length) { setServerError('Please choose at least one interest.'); return }

    setSubmitting(true)
    try {
    const result = await signUp({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      location: values.location.trim(),
      interests,
    })
    if (!result.ok) setServerError(result.error ?? 'Unable to create your account.')
    else if (result.data?.needsConfirmation) setConfirmEmail(values.email.trim())
    else router.push('/dashboard')
    } catch { setServerError('Could not connect. Please try again.') }
    finally { setSubmitting(false) }
  }

  if (confirmEmail) {
    return (
      <FormAlert tone="success">
        Almost done — we sent a confirmation link to <strong>{confirmEmail}</strong>. Open it to activate your account, then log in.
      </FormAlert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-teal-dark">{choosingInterests ? 'Step 2 of 2 · Choose your interests' : 'Step 1 of 2 · Account details'}</p>
      {serverError && <FormAlert tone="error">{serverError}</FormAlert>}
      {!choosingInterests && <div className="flex flex-col gap-5">
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
      </div>}
      {choosingInterests && <InterestPicker value={interests} onChange={setInterests} disabled={submitting} />}
      {choosingInterests && <button type="button" disabled={submitting} onClick={() => { setChoosingInterests(false); setServerError('') }} className="self-start rounded text-sm font-semibold text-teal-dark underline">Back to account details</button>}
      <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full')}>
        {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Creating your profile…' : choosingInterests ? 'Create account & personalize my feed' : 'Continue to interests'}
      </button>
    </form>
  )
}

