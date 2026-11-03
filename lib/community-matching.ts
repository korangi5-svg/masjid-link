import { parseInterests } from '@/lib/interests'

export const communityLanguages = ['English', 'Urdu', 'Arabic', 'French', 'Bengali', 'Somali', 'Turkish'] as const
export const communityGoals = ['Learn Quran', 'Understand tafsir', 'Build prayer habits', 'Learn Islamic history', 'Support my family', 'Build foundations'] as const
export const communityAges = ['Under 18', '18–24', '25–34', '35–49', '50+'] as const
export type MatchingPreferences = { enabled: boolean; city: string; languages: string[]; goals: string[]; age: string }
export type CommunityGroup = { id: string; name: string; description: string; city: string; languages: string[]; goals: string[]; ages: string[]; interests: string[]; resource: string }
export const emptyMatchingPreferences: MatchingPreferences = { enabled: false, city: '', languages: [], goals: [], age: '' }
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim()
export function matchingPreferences(value: unknown): MatchingPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid matching preferences.')
  const item = value as Record<string, unknown>
  if (typeof item.enabled !== 'boolean' || typeof item.city !== 'string' || item.city.length > 100 || typeof item.age !== 'string' || (item.age !== '' && !(communityAges as readonly string[]).includes(item.age))) throw new Error('Choose a valid age bracket and a city of at most 100 characters.')
  const list = (value: unknown, allowed: readonly string[]) => {
    if (!Array.isArray(value) || value.length > allowed.length || value.some(entry => typeof entry !== 'string' || !allowed.includes(entry))) throw new Error('Choose languages and goals from the available options.')
    return [...new Set(value)] as string[]
  }
  return { enabled: item.enabled, city: item.city.trim().replace(/\s+/g, ' '), age: item.age, languages: list(item.languages, communityLanguages), goals: list(item.goals, communityGoals) }
}
export function recommendGroups(groups: CommunityGroup[], preferences: MatchingPreferences, interests: unknown) {
  const selected = parseInterests(interests)
  return groups.flatMap(group => {
    // A specific age group is never inferred from interests, names, or browsing behavior.
    if (group.ages.length && (!preferences.enabled || !preferences.age || !group.ages.includes(preferences.age))) return []
    const reasons: string[] = []
    let score = 0
    if (preferences.enabled) {
      if (preferences.city && group.city && normalize(group.city) === normalize(preferences.city)) { score += 4; reasons.push(`Same city: ${group.city}`) }
      const languages = group.languages.filter(language => preferences.languages.includes(language))
      if (languages.length) { score += 3; reasons.push(`Shared language: ${languages.join(', ')}`) }
      const goals = group.goals.filter(goal => preferences.goals.includes(goal))
      if (goals.length) { score += Math.min(goals.length, 3) * 3; reasons.push(`Learning goals: ${goals.join(', ')}`) }
      if (group.ages.includes(preferences.age)) { score += 2; reasons.push(`Same age bracket: ${preferences.age}`) }
      const shared = group.interests.filter(interest => selected.includes(interest as never))
      if (shared.length) { score += shared.length * 2; reasons.push('Matches your saved interests') }
    }
    return [{ ...group, score, reasons }]
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

// These are new on-site starter groups, not claims about external organizations or existing members.
export const starterGroups: CommunityGroup[] = [
  { id: 'quran-circle', name: 'Quran Learning Circle', description: 'Learn Quran together, share a learning intention, and return to a manageable daily practice.', city: '', languages: ['English'], goals: ['Learn Quran'], ages: [], interests: ['quran'], resource: '/resources#quran' },
  { id: 'tafsir-circle', name: 'Tafsir Study Circle', description: 'Explore sourced explanations and reflect on Quranic meaning.', city: '', languages: ['English', 'Arabic'], goals: ['Understand tafsir'], ages: [], interests: ['tafsir', 'quran'], resource: '/learn' },
  { id: 'new-muslim-circle', name: 'Foundations Together', description: 'A welcoming starter group for learning faith, prayer, and purification at your own pace.', city: '', languages: ['English'], goals: ['Build foundations', 'Build prayer habits'], ages: [], interests: ['new-muslims'], resource: '/learning-path' },
  { id: 'family-circle', name: 'Faith & Family Circle', description: 'Explore practical family learning and parenting resources.', city: '', languages: ['English'], goals: ['Support my family'], ages: [], interests: ['parenting'], resource: '/learn' },
  { id: 'history-circle', name: 'Islamic History Circle', description: 'Discover Islamic history and discuss what you are learning.', city: '', languages: ['English'], goals: ['Learn Islamic history'], ages: [], interests: ['islamic-history'], resource: '/learn' },
  { id: 'toronto-learners', name: 'Toronto Learning Circle', description: 'An on-site circle for learners who choose Toronto, Canada as their city.', city: 'Toronto, Canada', languages: ['English', 'Urdu'], goals: ['Learn Quran', 'Build prayer habits'], ages: [], interests: ['quran', 'new-muslims'], resource: '/masjids' },
  { id: 'urdu-circle', name: 'Urdu Learning Circle', description: 'Find a shared starting point for learning in Urdu.', city: '', languages: ['Urdu'], goals: ['Build foundations', 'Learn Quran'], ages: [], interests: ['quran', 'new-muslims'], resource: '/learn' },
  { id: 'french-circle', name: 'French Learning Circle', description: 'Connect around shared learning goals in French.', city: '', languages: ['French'], goals: ['Learn Quran', 'Build foundations'], ages: [], interests: ['quran', 'new-muslims'], resource: '/learn' },
  { id: 'young-adult-circle', name: 'Young Adult Learning Circle', description: 'A starter circle for learners who choose the 18–24 age bracket.', city: '', languages: ['English'], goals: ['Build prayer habits', 'Build foundations'], ages: ['18–24'], interests: ['youth', 'new-muslims'], resource: '/learning-path' },
  { id: 'lifelong-circle', name: 'Lifelong Learning Circle', description: 'A starter circle for learners who choose the 50+ age bracket.', city: '', languages: ['English', 'Urdu'], goals: ['Learn Quran', 'Understand tafsir'], ages: ['50+'], interests: ['quran', 'tafsir'], resource: '/learn' },
]
