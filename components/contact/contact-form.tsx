'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { Check, ChevronDown, LoaderCircle, MessageCircle, Send } from 'lucide-react'
import { FormAlert, TextAreaField, TextField } from '@/components/forms/form-field'
import { submitContactMessage } from '@/lib/services/contact'
import { primaryButton } from '@/lib/site'
import { hasErrors, validateEmail, validateRequired, type FieldErrors } from '@/lib/validation'
import type { ContactMessage } from '@/lib/types'
import { CONTACT_PURPOSES, getContactPurpose } from '@/lib/contact-purposes'

type Field = keyof ContactMessage
const empty: ContactMessage = { purpose: '', name: '', email: '', subject: '', message: '' }

function validate(v: ContactMessage): FieldErrors<Field> {
  return {
    purpose: getContactPurpose(v.purpose) ? undefined : 'Please select a purpose for your message.',
    name: validateRequired(v.name, 'name', 100),
    email: validateEmail(v.email),
    subject: validateRequired(v.subject, 'subject', 150),
    message: validateRequired(v.message, 'message', 3000),
  }
}

export function ContactForm() {
  const purposeId = useId()
  const purposeRef = useRef<HTMLSelectElement>(null)
  const [values, setValues] = useState<ContactMessage>(empty)
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')
  const selectedPurpose = getContactPurpose(values.purpose)
  const completed = Object.values(values).filter(value => value.trim()).length

  const update = (field: Field) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
    if (status !== 'submitting') setStatus('idle')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      if (nextErrors.purpose) purposeRef.current?.focus()
      return
    }

    setStatus('submitting')
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])) as ContactMessage
    const result = await submitContactMessage(trimmed)
    if (result.ok) {
      setStatus('success')
      setValues(empty)
    } else {
      setStatus('error')
      setServerError(result.error ?? 'Something went wrong.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-white shadow-sm"><MessageCircle className="size-5" aria-hidden="true" /></span>
        <div><h2 className="text-xl font-bold text-navy">Send a message</h2><p className="mt-1 text-sm text-muted-foreground">A question, an idea, a new connection. Start here.</p></div>
      </div>
      <div className={`rounded-2xl border p-4 transition-colors motion-reduce:transition-none sm:p-5 ${selectedPurpose ? 'border-teal/40 bg-accent/40' : 'border-border bg-surface'}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor={purposeId} className="text-sm font-semibold text-navy">Purpose of your message <span className="text-teal" aria-hidden="true">*</span></label>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-dark">Start here</span>
        </div>
        <div className="relative">
          <select ref={purposeRef} id={purposeId} name="purpose" required value={values.purpose} onChange={update('purpose')} disabled={status === 'submitting'} aria-invalid={Boolean(errors.purpose)} aria-describedby={`${purposeId}-hint${errors.purpose ? ` ${purposeId}-error` : ''}`} className="min-h-14 w-full appearance-none rounded-xl border border-navy/15 bg-white py-3 pl-4 pr-12 text-base font-medium text-navy shadow-sm transition focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/15 disabled:opacity-60 motion-reduce:transition-none">
            <option value="" disabled>Select a purpose…</option>
            {CONTACT_PURPOSES.map(purpose => <option key={purpose.value} value={purpose.value}>{purpose.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-teal" aria-hidden="true" />
        </div>
        <p id={`${purposeId}-hint`} aria-live="polite" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">{selectedPurpose && <Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />}<span>{selectedPurpose?.hint || 'Choose the option that best matches your inquiry.'}</span></p>
        {errors.purpose && <p id={`${purposeId}-error`} role="alert" className="mt-2 text-sm font-medium text-destructive">{errors.purpose}</p>}
      </div>
      {status === 'success' && (
        <FormAlert tone="success">{"JazakAllahu khayran! Your message has been accepted for email delivery. We'll be in touch soon."}</FormAlert>
      )}
      {status === 'error' && <FormAlert tone="error">{serverError}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" name="name" autoComplete="name" value={values.name} onChange={update('name')} error={errors.name} maxLength={100} />
        <TextField label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={update('email')} error={errors.email} maxLength={254} />
      </div>
      <TextField label="Subject" name="subject" value={values.subject} onChange={update('subject')} error={errors.subject} maxLength={150} />
      <TextAreaField label="Message" name="message" value={values.message} onChange={update('message')} error={errors.message} maxLength={3000} />

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground" aria-live="polite">{completed} of 5 fields completed</p>
      <button type="submit" disabled={status === 'submitting'} className={`${primaryButton} self-start shadow-md transition-transform hover:-translate-y-0.5 motion-reduce:transform-none sm:self-auto`}>
        {status === 'submitting' ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
      </div>
    </form>
  )
}
