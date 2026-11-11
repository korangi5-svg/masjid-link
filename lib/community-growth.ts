import { dailyPreferences } from './daily-learning'
import { parseActivity } from './recommendation-engine'

const day = 86_400_000

export function communityGrowthPreferences(value: unknown) {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    moderatorInterest: raw.moderatorInterest === true,
    supporterInterest: raw.supporterInterest === true,
    lastDashboardVisit: typeof raw.lastDashboardVisit === 'number' && Number.isFinite(raw.lastDashboardVisit)
      ? raw.lastDashboardVisit : 0,
  }
}

export function communityGrowthCampaigns(metadata: Record<string, unknown>, now = Date.now()) {
  const preferences = communityGrowthPreferences(metadata.community_growth)
  const activity = parseActivity(metadata.recommendation_activity, now)
  const completions = activity.enabled ? activity.completed : []
  const recentCompletions = completions.filter(item => item.at >= now - 30 * day)
  const daily = dailyPreferences(metadata.daily_learning)
  const learningDates = [...daily.completedDates, ...daily.reflectionDates]
  const lastLearning = Math.max(0, ...learningDates.map(date => Date.parse(date)).filter(at => at <= now))
  const priorVisit = preferences.lastDashboardVisit <= now ? preferences.lastDashboardVisit : 0
  const lastActivity = activity.enabled ? Math.max(priorVisit, lastLearning, ...completions.map(item => item.at)) : 0
  const dormant = lastActivity > 0 && lastActivity < now - 30 * day
  const active = lastActivity > 0 && lastActivity >= now - 7 * day

  return [
    ...(dormant ? [{ id: 'return', title: 'Pick up your learning', text: 'Start again with one short lesson whenever you’re ready.', label: 'Read today’s lesson', href: '/daily-learning' }] : []),
    ...(active ? [{ id: 'active', title: 'Keep learning', text: 'Find your next lesson or course in the library.', label: 'Browse the library', href: '/learn' }] : []),
    ...(recentCompletions.length >= 3 ? [{ id: 'contribute', title: 'Share what you’ve learned', text: 'Send an article idea or a resource suggestion to the Connect to Masjid team.', label: 'Contact the team', href: '/contact' }] : []),
    ...(preferences.moderatorInterest ? [{ id: 'moderate', title: 'Help moderate discussions', text: 'Tell the team you’re interested in volunteering as a moderator.', label: 'Ask about moderation', href: '/contact' }] : []),
    ...(preferences.supporterInterest ? [{ id: 'support', title: 'Support Connect to Masjid', text: 'Ask the team how you can help with the website or community.', label: 'Explore ways to help', href: '/contact' }] : []),
  ]
}
