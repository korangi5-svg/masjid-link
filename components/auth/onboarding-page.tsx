'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { InterestPicker } from '@/components/auth/interest-picker'
import { FormAlert } from '@/components/forms/form-field'
import { parseInterests, type Interest } from '@/lib/interests'
import { getSupabase } from '@/lib/supabase'
import { primaryButton, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'

export function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<Interest[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setSelected(parseInterests(user?.user_metadata?.interests)) }, [user?.id])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!selected.length) { setError('Please choose at least one interest.'); return }
    const supabase = getSupabase()
    if (!supabase || !user) { setError('Please log in to save your interests.'); return }
    setSaving(true)
    try {
      // Auth metadata is persisted by Supabase and scoped to the signed-in account.
      const { error: saveError } = await supabase.auth.updateUser({ data: { interests: parseInterests(selected), onboarding_completed: true } })
      if (saveError) { setError('Could not save your interests. Please try again.'); return }
      router.replace('/dashboard')
    } catch { setError('Could not connect. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-dark">Your learning journey</p>
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Make yourself at home</h1>
      <p className="mt-3 text-muted-foreground">Tell us what interests you, and we’ll build your personalized feed.</p>
      {loading ? <p className="mt-8" role="status">Loading your profile…</p> : !user ? (
        <div className="mt-8"><p>Log in to save your interests and see your dashboard.</p><Link href="/login" className={cn(primaryButton, 'mt-4')}>Log in</Link></div>
      ) : (
        <form onSubmit={submit} className="mt-8 flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <InterestPicker value={selected} onChange={setSelected} disabled={saving} />
          {error && <FormAlert tone="error">{error}</FormAlert>}
          <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Saving your interests…' : 'Save interests & build my dashboard'}</button>
          <Link href="/account" className={cn(secondaryButton, 'self-center')}>My account</Link>
        </form>
      )}
    </div>
  )
}
