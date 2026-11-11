'use client'

import { relatedLearning } from '@/lib/learning-graph'
import type { CatalogResource } from '@/lib/recommendations'
import { interestLabel } from '@/lib/interests'
import { focusRing, secondaryButton } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { LearningState } from './use-learning-activity'

export const formatLabels = { article: 'Article', lecture: 'Lecture', course: 'Course', podcast: 'Podcast' }
const completeLabels = { article: 'Mark read', lecture: 'Mark watched', course: 'Mark completed', podcast: 'Mark listened' }

export function ContentCard({ item, reason, state }: { item: CatalogResource; reason?: string; state: LearningState }) {
  const completed = state.activity.completed.some((entry) => entry.contentId === item.id)
  const related = relatedLearning(item.id)
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">{formatLabels[item.kind]} · {item.publisher}</p>
      <h3 className="mt-3 text-xl font-bold leading-snug text-navy">{item.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      <p className="mt-4 text-xs text-muted-foreground">{item.interests.map(interestLabel).join(' · ')}</p>
      {reason && <p className="mt-3 text-xs font-medium text-teal-dark">{reason}</p>}
      {related.topics.length > 0 && <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-navy">Explore related learning</summary>
        <ul className="mt-2 space-y-2">
          {related.topics.map(topic => <li key={topic.title}><a href={topic.href} className="text-teal-dark underline">{topic.title}</a> · {topic.type}</li>)}
          {related.resources.map(resource => <li key={resource.id}><a href={resource.href} className="text-teal-dark underline">{resource.title}</a> · {formatLabels[resource.kind]}</li>)}
          {related.scholars.map(scholar => <li key={scholar.id}><a href="/scholars" className="text-teal-dark underline">{scholar.name}</a> · Scholar</li>)}
        </ul>
      </details>}
      <div className="mt-auto pt-5">
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={cn('inline-block rounded text-sm font-bold text-navy hover:text-teal', focusRing)}>Open {formatLabels[item.kind].toLowerCase()} <span aria-hidden="true">↗</span><span className="sr-only">: {item.title} (opens in a new tab)</span></a>
        <div className="mt-4"><button type="button" aria-label={`${completed ? 'Undo completion' : completeLabels[item.kind]}: ${item.title}`} aria-pressed={completed} disabled={!state.user || !state.activity.enabled || state.saving} className={cn(secondaryButton, 'w-full')} onClick={() => void state.save({ type: completed ? 'undo' : 'complete', contentId: item.id })}>{completed ? 'Completed ✓ · Undo' : completeLabels[item.kind]}</button></div>
      </div>
    </article>
  )
}
