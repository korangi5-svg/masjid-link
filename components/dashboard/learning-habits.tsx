import Link from 'next/link'
import { learningHabits } from '@/lib/learning-habits'

export function LearningHabits({ metadata }: { metadata: Record<string, unknown> }) {
  const habits = learningHabits(metadata)
  const stats = [
    ['Current streak', habits.streak],
    ['Days learned', habits.days],
    ['Articles read', habits.articles],
    ['Courses completed', habits.courses],
    ['Quran reflections viewed', habits.reflections],
  ] as const
  return (
    <section className="my-8 rounded-2xl border border-border bg-surface p-6" aria-labelledby="learning-habits">
      <h2 id="learning-habits" className="text-2xl font-bold text-navy">Your learning habits</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Mark progress in the learning library or <Link href="/daily-learning" className="underline">daily lesson</Link> to build your streak.
      </p>
      <dl className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map(([label, count]) => <div key={label}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-2xl font-bold text-navy">{count}</dd>
        </div>)}
      </dl>
      <h3 className="font-semibold text-navy">Achievements</h3>
      <ul className="mt-3 flex flex-wrap gap-3">
        {habits.badges.map(badge => <li key={badge.name} className="rounded-xl border border-border px-4 py-3">
          <p className="font-semibold text-navy">{badge.name} · {badge.earned ? 'Earned' : 'In progress'}</p>
          <p className="text-sm text-muted-foreground">{badge.requirement}</p>
        </li>)}
      </ul>
    </section>
  )
}
