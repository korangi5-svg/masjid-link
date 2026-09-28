const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string) {
  const email = value.trim()
  if (!email) return 'Please enter your email address.'
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.'
  return undefined
}

export function validateRequired(value: string, label: string, max = 200) {
  const v = value.trim()
  if (!v) return `Please enter your ${label}.`
  if (v.length > max) return `${label[0].toUpperCase()}${label.slice(1)} must be ${max} characters or fewer.`
  return undefined
}

export function validatePassword(value: string) {
  if (!value) return 'Please enter a password.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use at least one letter and one number.'
  return undefined
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export function hasErrors<T extends string>(errors: FieldErrors<T>) {
  return Object.values(errors).some(Boolean)
}
