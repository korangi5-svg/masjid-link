import { interestLabel, parseInterests, type Interest } from './interests'
import { contentCatalog, scholars, type CatalogResource } from './recommendations'

export type CompletionKind = 'read' | 'watched' | 'completed' | 'listened'
export interface ActivityEntry { contentId: string; action: CompletionKind; at: number }
export interface SearchEntry { topics: Interest[]; at: number }
export interface RecommendationActivity {
  version: 1
  enabled: boolean
  completed: ActivityEntry[]
  searches: SearchEntry[]
  followedScholars: string[]
}
export type ActivityAction =
  | { type: 'enable'; enabled: boolean }
  | { type: 'clear' }
  | { type: 'follow'; scholarId: string; following: boolean }
  | { type: 'complete'; contentId: string }
  | { type: 'undo'; contentId: string }
  | { type: 'search'; query: string }

const DAY = 86400000
const MAX_AGE = 180 * DAY
export const completionAction = { article: 'read', lecture: 'watched', course: 'completed', podcast: 'listened' } as const
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

/** Metadata is untrusted. Bound history, reject unknown IDs, and expire old signals. */
export function parseActivity(value: unknown, now = Date.now()): RecommendationActivity {
  const raw = record(value)
  const validTime = (at: unknown): at is number => typeof at === 'number' && Number.isFinite(at) && at <= now && at >= now - MAX_AGE
  const seen = new Set<string>()
  const completed: ActivityEntry[] = (Array.isArray(raw.completed) ? raw.completed : [])
    .map(record).filter((entry) => validTime(entry.at))
    .sort((a, b) => Number(b.at) - Number(a.at))
    .flatMap((entry): ActivityEntry[] => {
      const item = contentCatalog.find((item) => item.id === entry.contentId)
      if (!item || seen.has(item.id) || entry.action !== completionAction[item.kind]) return []
      seen.add(item.id)
      return [{ contentId: item.id, action: completionAction[item.kind], at: Number(entry.at) }]
    }).slice(0, 32)
  const searches: SearchEntry[] = (Array.isArray(raw.searches) ? raw.searches : [])
    .map(record).filter((entry) => validTime(entry.at))
    .map((entry) => ({ topics: parseInterests(entry.topics), at: Number(entry.at) }))
    .filter((entry) => entry.topics.length > 0)
    .sort((a, b) => b.at - a.at).slice(0, 12)
  const followedScholars = scholars.filter((scholar) => Array.isArray(raw.followedScholars) && raw.followedScholars.includes(scholar.id)).map((scholar) => scholar.id)
  return { version: 1, enabled: raw.enabled === true, completed, searches, followedScholars }
}

/** Store matched topic IDs, never the member's raw search text. */
export function searchTopics(query: string): Interest[] {
  const text = query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '')
  const aliases: Record<Interest, RegExp> = {
    quran: /\b(quran|quranic|koran|recitation|surah|surahs)\b/,
    tafsir: /\b(tafsir|tafseer|reflection|reflections|exegesis)\b/,
    'islamic-history': /\b(history|heritage|seerah|sirah|sahaba|companions|firsts)\b/,
    parenting: /\b(parent|parents|parenting|family|families|children)\b/,
    'new-muslims': /\b(new muslims?|convert|converts|revert|reverts|beginner|beginners|salah)\b/,
    youth: /\b(youth|young|teen|teens|teenager|teenagers|identity)\b/,
  }
  return parseInterests(Object.entries(aliases).filter(([, pattern]) => pattern.test(text)).map(([id]) => id))
}

export function applyActivityAction(value: unknown, action: ActivityAction, now = Date.now()): RecommendationActivity {
  const activity = parseActivity(value, now)
  if (action.type === 'clear') return { ...activity, completed: [], searches: [], followedScholars: [] }
  if (action.type === 'enable') return { ...activity, enabled: action.enabled }
  if (!activity.enabled) return activity
  if (action.type === 'follow' && scholars.some((scholar) => scholar.id === action.scholarId)) {
    return { ...activity, followedScholars: action.following ? [...new Set([...activity.followedScholars, action.scholarId])] : activity.followedScholars.filter((id) => id !== action.scholarId) }
  }
  if (action.type === 'undo') return { ...activity, completed: activity.completed.filter((entry) => entry.contentId !== action.contentId) }
  if (action.type === 'complete') {
    const item = contentCatalog.find((item) => item.id === action.contentId)
    if (!item) return activity
    return { ...activity, completed: [{ contentId: item.id, action: completionAction[item.kind], at: now }, ...activity.completed.filter((entry) => entry.contentId !== item.id)].slice(0, 32) }
  }
  if (action.type === 'search') {
    const topics = searchTopics(action.query)
    if (!topics.length) return activity
    // Repeating the same search cannot amplify its weight.
    return { ...activity, searches: [{ topics, at: now }, ...activity.searches.filter((entry) => entry.topics.join() !== topics.join())].slice(0, 12) }
  }
  return activity
}

export interface RankedResource extends CatalogResource { score: number; reason: string }

/** Content-based ranking: onboarding + recent engagement + searches + followed scholars.
 * No LLM, tracking pixel, external profiling API, or collaborative-training claim.
 */
export function rankRecommendations(selected: unknown, value: unknown, now = Date.now(), catalog: CatalogResource[] = contentCatalog): RankedResource[] {
  const activity = parseActivity(value, now)
  const chosen = parseInterests(selected)
  const weights = new Map<Interest, number>(chosen.map((id) => [id, 4]))
  const history = new Map<Interest, number>()
  const searched = new Set<Interest>()
  const decay = (at: number) => Math.pow(0.5, Math.max(0, now - at) / (30 * DAY))
  if (activity.enabled) {
    for (const entry of activity.completed) {
      const item = contentCatalog.find((item) => item.id === entry.contentId)!
      for (const topic of item.interests) history.set(topic, (history.get(topic) ?? 0) + 3 * decay(entry.at))
    }
    for (const [topic, weight] of history) weights.set(topic, (weights.get(topic) ?? 0) + Math.min(8, weight))
    for (const entry of activity.searches) for (const topic of entry.topics) {
      searched.add(topic)
      weights.set(topic, (weights.get(topic) ?? 0) + 2 * decay(entry.at))
    }
  }
  const completed = new Set(activity.enabled ? activity.completed.map((entry) => entry.contentId) : [])
  const urls = new Set<string>()
  return catalog.filter((item) => !completed.has(item.id)).map((item) => {
    const followed = activity.enabled ? scholars.find((scholar) => item.scholarIds.includes(scholar.id) && activity.followedScholars.includes(scholar.id)) : undefined
    const topicScore = item.interests.reduce((sum, topic) => sum + (weights.get(topic) ?? 0), 0) / Math.sqrt(Math.max(1, item.interests.length))
    const recentTopic = item.interests.find((topic) => history.has(topic))
    const searchTopic = item.interests.find((topic) => searched.has(topic))
    const selectedTopic = item.interests.find((topic) => chosen.includes(topic))
    const reason = followed ? `Because you follow ${followed.name}` : recentTopic ? `Inspired by your learning about ${interestLabel(recentTopic)}` : searchTopic ? `Because you searched for ${interestLabel(searchTopic)}` : selectedTopic ? `Because you chose ${interestLabel(selectedTopic)}` : 'Discover a different topic'
    return { ...item, score: topicScore + (followed ? 7 : 0), reason }
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).filter((item) => {
    if (urls.has(item.href)) return false
    urls.add(item.href)
    return true
  })
}
