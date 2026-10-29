export const interests = [
  { id: 'quran', label: 'Quran', description: 'Read, listen, and reflect.' },
  { id: 'tafsir', label: 'Tafsir', description: 'Understand the meaning of the Quran.' },
  { id: 'islamic-history', label: 'Islamic History', description: 'Explore our history and heritage.' },
  { id: 'parenting', label: 'Parenting', description: 'Nurture faith and family life.' },
  { id: 'new-muslims', label: 'New Muslims', description: 'Build a foundation, one step at a time.' },
  { id: 'youth', label: 'Youth', description: 'Grow in faith, identity, and community.' },
] as const

export type Interest = (typeof interests)[number]['id']

export function parseInterests(value: unknown): Interest[] {
  if (!Array.isArray(value)) return []
  return interests.filter(({ id }) => value.includes(id)).map(({ id }) => id)
}

export function hasCompletedOnboarding(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.onboarding_completed === true && parseInterests(metadata?.interests).length > 0
}

export function interestLabel(id: Interest): string {
  return interests.find((interest) => interest.id === id)!.label
}
