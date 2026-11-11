import type { SupabaseClient } from '@supabase/supabase-js'
import { contentCatalog, scholars } from '@/lib/recommendations'
import { parseActivity, rankRecommendations } from '@/lib/recommendation-engine'
import { scholarUpdates } from '@/lib/scholar-follow'

const site = 'https://masjid-link.vercel.app'
const week = 7 * 86_400_000

export async function loadWeeklyCommunity(db: SupabaseClient, now: number) {
  const since = now - week
  const discussions = await db.from('discussion_posts')
    .select('body')
    .eq('status', 'approved')
    .is('parent_id', null)
    .gte('created_at', new Date(since).toISOString())
    .lte('created_at', new Date(now).toISOString())
    .order('created_at', { ascending: false })
    .limit(3)
  if (discussions.error) throw discussions.error

  const counts = new Map<string, number>()
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    for (const user of data.users) {
      if (!user.email_confirmed_at) continue
      const activity = parseActivity(user.user_metadata.recommendation_activity, now)
      if (!activity.enabled) continue
      for (const item of activity.completed) {
        if (item.action === 'read' && item.at >= since) {
          counts.set(item.contentId, (counts.get(item.contentId) ?? 0) + 1)
        }
      }
    }
    if (data.users.length < 100) break
  }

  const articles = contentCatalog.filter(item => item.kind === 'article' && counts.has(item.id))
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
    .slice(0, 3)

  return {
    discussions: discussions.data.map(({ body }) => String(body).replace(/\s+/g, ' ').trim().slice(0, 120)),
    articles,
  }
}

export function weeklyEngagementSections(
  metadata: Record<string, unknown>,
  community: Awaited<ReturnType<typeof loadWeeklyCommunity>>,
  now: number,
) {
  const activity = parseActivity(metadata.recommendation_activity, now)
  const preferences = metadata.scholar_notifications
  const completed = new Set(activity.enabled ? activity.completed.map(item => item.contentId) : [])
  const missed = scholarUpdates(activity, preferences, now)
    .filter(item => !completed.has(item.id) && Date.parse(item.publishedAt!) >= now - week)
    .slice(0, 3)
  const featured = new Set([...missed, ...community.articles].map(item => item.id))
  const ranked = rankRecommendations(metadata.interests, activity, now)
  const recommended = ranked
    .filter(item => !featured.has(item.id))
    .filter(item => item.kind !== 'article' && item.kind !== 'course')
    .slice(0, 3)
  const articles = ranked.filter(item => item.kind === 'article' && !featured.has(item.id)).slice(0, 3)
  const courses = ranked.filter(item => item.kind === 'course' && !featured.has(item.id)).slice(0, 3)
  const followed = new Set(activity.enabled ? activity.followedScholars : [])
  const scholarIds = new Set(ranked.filter(item => item.score > 0).flatMap(item => item.scholarIds))
  const suggestedScholars = [...scholarIds].filter(id => !followed.has(id)).slice(0, 3).flatMap(id => {
    const scholar = scholars.find(item => item.id === id)
    return scholar ? [{ title: scholar.name, href: `${site}/scholars#scholar-${id}` }] : []
  })
  return [
    { title: 'Content you may have missed', items: missed },
    { title: 'New discussions', items: community.discussions.map(title => ({ title, href: `${site}/discussions` })) },
    { title: 'Popular articles', items: community.articles },
    { title: 'Recommended learning', items: recommended },
    { title: 'Recommended scholars', items: suggestedScholars },
    { title: 'Articles for you', items: articles },
    { title: 'Courses for you', items: courses },
  ]
}

export function weeklyEngagementText(
  metadata: Record<string, unknown>,
  community: Awaited<ReturnType<typeof loadWeeklyCommunity>>,
  now: number,
) {
  return weeklyEngagementSections(metadata, community, now)
    .filter(({ items }) => items.length)
    .map(({ title, items }) => `${title}\n${items.map(item => `${item.title}\n${item.href}`).join('\n\n')}`)
    .join('\n\n')
}
