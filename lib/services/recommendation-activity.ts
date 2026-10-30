import { getSupabase } from '@/lib/supabase'
import { applyActivityAction, type ActivityAction, type RecommendationActivity } from '@/lib/recommendation-engine'

// Serialize writes in this browser so quick follow/completion actions merge correctly.
let pending: Promise<unknown> = Promise.resolve()

export function saveRecommendationActivity(userId: string, action: ActivityAction): Promise<RecommendationActivity> {
  const operation = pending.catch(() => {}).then(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Please log in to save learning activity.')
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user || data.user.id !== userId) throw new Error('Your session changed. Please log in again.')
    const next = applyActivityAction(data.user.user_metadata?.recommendation_activity, action)
    const { error: saveError } = await supabase.auth.updateUser({ data: { recommendation_activity: next } })
    if (saveError) throw new Error('Could not save your learning activity. Please try again.')
    return next
  })
  pending = operation
  return operation
}
