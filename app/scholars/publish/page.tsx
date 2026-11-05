'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { inputClass, primaryButton } from '@/lib/site'

export default function PublishPage() {
  const submission = useRef<{ id: string; title: string; body: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState<{ id: string; drafts: Record<string, string> } | null>(null)

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title')).trim()
    const body = String(form.get('body')).trim()
    if (submission.current?.title !== title || submission.current?.body !== body) {
      submission.current = { id: crypto.randomUUID(), title, body }
    }
    setSaving(true)
    setError('')
    try {
      const session = await getSupabase()?.auth.getSession()
      const token = session?.data.session?.access_token
      if (!token) throw new Error('Sign in with your owner account to publish.')
      const response = await fetch('/api/scholar-publishing', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(submission.current),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setPublished(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Publishing could not be completed.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-4xl font-bold text-navy">Publish a scholar article</h1>
    <p className="my-4">Sign in with the owner account. Article text is sent to OpenAI to generate a summary, tags, categories, SEO metadata and social captions. The article goes public when generation succeeds.</p>
    <Link href="/login" className="underline">Sign in</Link>
    {published ? <section className="mt-6 space-y-4">
      <p role="status">Article published. <Link href={`/scholars/articles/${published.id}`} className="underline">Read the article</Link></p>
      <h2 className="text-xl font-bold">Social drafts</h2>
      {Object.entries(published.drafts).map(([platform, caption]) => <div key={platform}>
        <h3 className="font-semibold">{platform}</h3>
        <p className="whitespace-pre-wrap">{caption}</p>
      </div>)}
      <button type="button" className={primaryButton} onClick={() => { submission.current = null; setPublished(null) }}>Publish another article</button>
    </section> : <form onSubmit={publish} className="mt-6 space-y-4">
      <label className="block">Title<input className={inputClass} name="title" maxLength={150} required disabled={saving} /></label>
      <label className="block">Article text<textarea className={inputClass} name="body" rows={12} minLength={100} maxLength={20000} required disabled={saving} /></label>
      {error && <p role="alert">{error}</p>}
      <button className={primaryButton} disabled={saving}>{saving ? 'Preparing publication…' : 'Generate and publish'}</button>
    </form>}
  </main>
}
