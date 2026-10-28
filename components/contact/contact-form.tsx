'use client'

import { useState, type FormEvent } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { FormAlert, TextAreaField, TextField } from '@/components/forms/form-field'
import { submitContactMessage } from '@/lib/services/contact'
import { primaryButton } from '@/lib/site'
import { hasErrors, validateEmail, validateRequired, type FieldErrors } from '@/lib/validation'
import type { ContactMessage } from '@/lib/types'

type Field = keyof ContactMessage
const empty: ContactMessage = { name: '', email: '', subject: '', message: '' }

function validate(v: ContactMessage): FieldErrors<Field> {
  return {
    name: validateRequired(v.name, 'name', 100),
    email: validateEmail(v.email),
    subject: validateRequired(v.subject, 'subject', 150),
    message: validateRequired(v.message, 'message', 3000),
  }
}

export function ContactForm() {
  const [values, setValues] = useState<ContactMessage>(empty)
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const update = (field: Field) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-navy">Send a message</h2>
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

      <button type="submit" disabled={status === 'submitting'} className={`${primaryButton} self-start`}>
        {status === 'submitting' ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
