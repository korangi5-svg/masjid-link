import { contentCatalog, scholars, type CatalogResource } from './recommendations'
import { parseActivity } from '@/lib/recommendation-engine'
import type { Interest } from './interests'

export interface FollowPreferences {
  inApp: boolean
  weeklyEmail: boolean
  emailSince: number
  read: string[]
  since: Record<string, number>
}
// Follows created before this feature receive only content published after its launch.
export const FOLLOW_FEATURE_START = Date.UTC(2026, 9, 31)
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
export function parseFollowPreferences(value: unknown, now = Date.now()): FollowPreferences {
  const raw = object(value)
  const validTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= now
  const since = Object.fromEntries(scholars.flatMap(s => validTime(object(raw.since)[s.id]) ? [[s.id, object(raw.since)[s.id] as number]] : []))
  return { inApp: raw.inApp !== false, weeklyEmail: raw.weeklyEmail === true, emailSince: validTime(raw.emailSince) ? raw.emailSince : 0, since, read: Array.isArray(raw.read) ? [...new Set(raw.read.filter((id): id is string => typeof id === 'string' && id.length <= 100))].slice(-128) : [] }
}

export type FollowAction = { type: 'notifications'; inApp: boolean; weeklyEmail: boolean } | { type: 'read-notifications'; ids: string[] }
export function updateFollowPreferences(value: unknown, action: FollowAction, now = Date.now()): FollowPreferences {
  const prefs = parseFollowPreferences(value, now)
  if (action.type === 'notifications') return { ...prefs, inApp: action.inApp, weeklyEmail: action.weeklyEmail, emailSince: action.weeklyEmail && !prefs.weeklyEmail ? now : prefs.emailSince }
  return parseFollowPreferences({ ...prefs, read: [...prefs.read, ...action.ids] }, now)
}

/** Only platform-published, attributed content can generate an update; never guess dates. */
export function scholarUpdates(activityValue: unknown, preferenceValue: unknown, now = Date.now(), catalog: CatalogResource[] = contentCatalog) {
  const activity = parseActivity(activityValue, now)
  const prefs = parseFollowPreferences(preferenceValue, now)
  const ids = new Set<string>()
  return catalog.filter(item => {
    const at = item.publishedAt ? Date.parse(item.publishedAt) : NaN
    if (!Number.isFinite(at) || at > now || at < now - 90 * 86400000 || ids.has(item.id)) return false
    if (!item.scholarIds.some(id => activity.followedScholars.includes(id) && at >= (prefs.since[id] ?? FOLLOW_FEATURE_START))) return false
    ids.add(item.id)
    return true
  }).sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!))
}

export function weeklyDigest(activity: unknown, preferences: unknown, now = Date.now(), catalog: CatalogResource[] = contentCatalog) {
  const prefs = parseFollowPreferences(preferences, now)
  return scholarUpdates(activity, prefs, now, catalog).filter(item => Date.parse(item.publishedAt!) > Math.max(now - 7 * 86400000, prefs.emailSince))
}

/** Topics come from attributed catalogue items; no invented scholar expertise. */
export function similarScholars(activityValue: unknown, catalog: CatalogResource[] = contentCatalog) {
  const follows = parseActivity(activityValue).followedScholars
  const topicsFor = (id: string) => new Set(catalog.filter(item => item.scholarIds.includes(id)).flatMap(item => item.interests))
  const topics = new Set(follows.flatMap(id => [...topicsFor(id)]))
  return scholars.filter(s => !follows.includes(s.id)).map(s => ({ ...s, sharedTopics: [...topicsFor(s.id)].filter((topic): topic is Interest => topics.has(topic)) })).filter(s => s.sharedTopics.length).sort((a, b) => b.sharedTopics.length - a.sharedTopics.length || a.name.localeCompare(b.name))
}

export function digestWeek(now = Date.now()) {
  // Friday 13:00 UTC anchors each week, matching the Vercel cron.
  return String(Math.floor((now - Date.UTC(1970, 0, 2, 13)) / (7 * 86400000)))
}

export function digestText(items: CatalogResource[]) {
  return `Your weekly Masjid Link digest\n\n${items.map(item => `${item.title}\n${item.publisher} · ${item.kind}\n${item.href}`).join('\n\n')}\n\nManage scholar follows and stop weekly emails: https://masjid-link.vercel.app/notifications\n`
}
