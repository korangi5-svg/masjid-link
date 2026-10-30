'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { parseActivity, type ActivityAction, type RecommendationActivity } from '@/lib/recommendation-engine'
import { saveRecommendationActivity } from '@/lib/services/recommendation-activity'

export function useLearningActivity() {
  const { user, loading } = useAuth()
  const activeUser = useRef(user?.id)
  activeUser.current = user?.id
  const [saved, setSaved] = useState<{ userId: string; activity: RecommendationActivity } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setSaved(null); setError(''); setSaving(false) }, [user])
  const activity = saved && saved.userId === user?.id ? saved.activity : parseActivity(user?.user_metadata?.recommendation_activity)

  async function save(action: ActivityAction) {
    if (!user || saving) return false
    const userId = user.id
    setSaving(true)
    setError('')
    try {
      const result = await saveRecommendationActivity(userId, action)
      if (activeUser.current === userId) setSaved({ userId, activity: result })
      return true
    } catch (e) {
      if (activeUser.current === userId) setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
      return false
    } finally { if (activeUser.current === userId) setSaving(false) }
  }
  return { user, loading, activity, saving, error, save }
}

export type LearningState = ReturnType<typeof useLearningActivity>
