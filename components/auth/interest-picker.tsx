'use client'

import { interests, type Interest } from '@/lib/interests'
import { focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export function InterestPicker({ value, onChange, disabled = false }: { value: Interest[]; onChange: (value: Interest[]) => void; disabled?: boolean }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-lg font-bold text-navy">What would you like to learn about?</legend>
      <p className="mt-2 text-sm text-muted-foreground">Choose one or more interests. You can change these anytime.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {interests.map((interest) => (
          <label key={interest.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors', value.includes(interest.id) ? 'border-teal bg-accent' : 'border-border bg-white hover:border-teal')}>
            <input type="checkbox" name="interests" value={interest.id} checked={value.includes(interest.id)} onChange={(e) => onChange(e.target.checked ? [...value, interest.id] : value.filter((id) => id !== interest.id))} className={cn('mt-1 size-4 shrink-0 accent-teal', focusRing)} />
            <span><span className="block font-semibold text-navy">{interest.label}</span><span className="mt-1 block text-sm text-muted-foreground">{interest.description}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
