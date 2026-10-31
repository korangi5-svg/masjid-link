import { getSupabase } from '@/lib/supabase'
import { applyActivityAction, parseActivity, type ActivityAction, type RecommendationActivity } from '@/lib/recommendation-engine'
import { FOLLOW_FEATURE_START, parseFollowPreferences, updateFollowPreferences, type FollowAction, type FollowPreferences } from '@/lib/scholar-follow'

// Serialize writes in this browser so quick follow/completion actions merge correctly.
let pending: Promise<unknown> = Promise.resolve()

export function saveRecommendationActivity(userId: string, action: ActivityAction): Promise<RecommendationActivity> {
  const operation = pending.catch(() => {}).then(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Please log in to save learning activity.')
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user || data.user.id !== userId) throw new Error('Your session changed. Please log in again.')
    const next = applyActivityAction(data.user.user_metadata?.recommendation_activity, action)
    const prefs = parseFollowPreferences(data.user.user_metadata?.scholar_notifications)
    const previous = data.user.user_metadata?.recommendation_activity?.followedScholars
    for (const id of next.followedScholars) {
      if (!Array.isArray(previous) || !previous.includes(id)) prefs.since[id] = Date.now()
      else prefs.since[id] ??= FOLLOW_FEATURE_START
    }
    for (const id of Object.keys(prefs.since)) if (!next.followedScholars.includes(id)) delete prefs.since[id]
    const { error: saveError } = await supabase.auth.updateUser({ data: { recommendation_activity: next, scholar_notifications: prefs } })
    if (saveError) throw new Error('Could not save your learning activity. Please try again.')
    return next
  })
  pending = operation
  return operation
}

export function saveFollowPreferences(userId: string, action: FollowAction): Promise<FollowPreferences> {
  const operation = pending.catch(() => {}).then(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Please log in to save notifications.')
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user || data.user.id !== userId) throw new Error('Your session changed. Please log in again.')
    const prefs = updateFollowPreferences(data.user.user_metadata?.scholar_notifications, action)
    // Preserve visible updates for follows made before notification settings existed.
    for (const id of parseActivity(data.user.user_metadata?.recommendation_activity).followedScholars) prefs.since[id] ??= FOLLOW_FEATURE_START
    const { error: saveError } = await supabase.auth.updateUser({ data: { scholar_notifications: prefs } })
    if (saveError) throw new Error('Could not save notification preferences. Please try again.')
    return prefs
  })
  pending = operation
  return operation
}
