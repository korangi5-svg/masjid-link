'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { PasswordField } from '@/components/auth/password-field'
import { FormAlert, TextField } from '@/components/forms/form-field'
import { getProfile, signOut, updatePassword, updateProfile, type Profile } from '@/lib/services/auth'
import { focusRing, primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import { hasErrors, validatePassword, validateRequired, type FieldErrors } from '@/lib/validation'

type Status = { tone: 'success' | 'error'; text: string } | null

export function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Loading your account…
        </p>
      </Shell>
    )
  }

  if (!user) {
    return (
      <Shell>
        <FormAlert tone="error">
          You’re not logged in.{' '}
          <Link href="/login" className={cn('rounded font-semibold underline', focusRing)}>
            Log in
          </Link>{' '}
          to see your account.
        </FormAlert>
      </Shell>
    )
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })

  return (
    <Shell>
      <p className="-mt-6 text-muted-foreground">
        Signed in as <span className="font-semibold text-navy">{user.email}</span> · Member since {memberSince}
      </p>
      <Section title="Profile">
        <ProfileForm key={user.id} />
      </Section>
      <Section title="Your learning interests">
        <p className="mb-4 text-sm text-muted-foreground">Choose topics to personalize your learning feed.</p>
        <div className="flex flex-wrap gap-3"><Link href="/onboarding" className={secondaryButton}>Edit interests</Link><Link href="/dashboard" className={primaryButton}>My dashboard</Link></div>
      </Section>
      <Section title="Change password">
        <PasswordForm />
      </Section>
      <button type="button" onClick={handleSignOut} className={cn(secondaryButton, 'self-start')}>
        <LogOut className="size-4" aria-hidden="true" /> Log out
      </button>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">My account</h1>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-navy">{title}</h2>
      {children}
    </section>
  )
}

function ProfileForm() {
  const [values, setValues] = useState<Profile | null>(null)
  const [errors, setErrors] = useState<FieldErrors<keyof Profile>>({})
  const [status, setStatus] = useState<Status>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getProfile().then((result) => {
      if (result.ok && result.data) setValues(result.data)
      else setStatus({ tone: 'error', text: result.error ?? 'Could not load your profile.' })
    })
  }, [])

  if (!values) {
    return status ? (
      <FormAlert tone={status.tone}>{status.text}</FormAlert>
    ) : (
      <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-label="Loading profile" />
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!values) return
    const nextErrors = {
      fullName: validateRequired(values.fullName, 'full name', 100),
      location: validateRequired(values.location, 'city or location', 100),
    }
    setErrors(nextErrors)
    setStatus(null)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    const result = await updateProfile({ fullName: values.fullName.trim(), location: values.location.trim() })
    setSaving(false)
    setStatus(result.ok ? { tone: 'success', text: 'Your profile has been saved.' } : { tone: 'error', text: result.error ?? 'Could not save.' })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status && <FormAlert tone={status.tone}>{status.text}</FormAlert>}
      <TextField
        label="Full name"
        autoComplete="name"
        value={values.fullName}
        onChange={(e) => setValues({ ...values, fullName: e.target.value })}
        error={errors.fullName}
        maxLength={100}
      />
      <TextField
        label="City or location"
        autoComplete="address-level2"
        value={values.location}
        onChange={(e) => setValues({ ...values, location: e.target.value })}
        error={errors.location}
        maxLength={100}
      />
      <button type="submit" disabled={saving} className={cn(primaryButton, 'self-start')}>
        {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<Status>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const passwordError = validatePassword(password)
    setError(passwordError)
    setStatus(null)
    if (passwordError) return

    setSaving(true)
    const result = await updatePassword(password)
    setSaving(false)
    if (result.ok) {
      setPassword('')
      setStatus({ tone: 'success', text: 'Your password has been changed.' })
    } else {
      setStatus({ tone: 'error', text: result.error ?? 'Could not change your password.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status && <FormAlert tone={status.tone}>{status.text}</FormAlert>}
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
      <button type="submit" disabled={saving} className={cn(primaryButton, 'self-start')}>
        {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {saving ? 'Saving…' : 'Change password'}
      </button>
    </form>
  )
}

