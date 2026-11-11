import { dailyPreferences, learningDate } from './daily-learning'
import { parseActivity } from './recommendation-engine'

const day = 86_400_000

export function learningHabits(metadata: Record<string, unknown>, now = Date.now()) {
  const daily = dailyPreferences(metadata.daily_learning)
  const activity = parseActivity(metadata.recommendation_activity, now)
  const completed = activity.enabled ? activity.completed : []
  const today = learningDate(now)
  const days = new Set([
    ...daily.completedDates,
    ...daily.reflectionDates,
    ...completed.map(item => learningDate(item.at)),
  ].filter(date => date <= today))
  let cursor = Date.parse(today)
  if (!days.has(today)) cursor -= day
  let streak = 0
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++
    cursor -= day
  }

  const articles = completed.filter(item => item.action === 'read').length
  const courses = completed.filter(item => item.action === 'completed').length
  const reflections = daily.reflectionDates.filter(date => date <= today).length
  const badges = [
    { name: 'First step', earned: days.size >= 1, requirement: 'Record learning on one day' },
    { name: 'Consistent learner', earned: streak >= 7, requirement: 'Learn seven days in a row' },
    { name: 'Active reader', earned: articles >= 5, requirement: 'Mark five articles as read' },
    { name: 'Course finisher', earned: courses >= 1, requirement: 'Mark one course as complete' },
    { name: 'Quran reflection habit', earned: reflections >= 7, requirement: 'Mark seven daily Quran reflections as viewed' },
  ]
  return { days: days.size, streak, articles, courses, reflections, badges }
}
