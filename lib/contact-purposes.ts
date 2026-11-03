export const CONTACT_PURPOSES = [
  { value: 'general', label: 'General inquiry', hint: 'Ask us about Connect to Masjid and how to get started.' },
  { value: 'masjid', label: 'Add or update a masjid', hint: 'Include the masjid name, location and details you would like to add or correct.' },
  { value: 'support', label: 'Website or account support', hint: 'Tell us what went wrong and which page you were using. Never include passwords or API keys.' },
  { value: 'events', label: 'Events and community activities', hint: 'Share the event name, date and location, or ask about an upcoming activity.' },
  { value: 'partnership', label: 'Partnership or collaboration', hint: 'Introduce your organization and tell us how you would like to work together.' },
  { value: 'feedback', label: 'Feedback or suggestion', hint: 'Tell us what is working well or what we can improve for the community.' },
  { value: 'other', label: 'Something else', hint: 'Share your question or request and we will help you find the right next step.' },
] as const

export function getContactPurpose(value: unknown) {
  return CONTACT_PURPOSES.find(purpose => purpose.value === value)
}
