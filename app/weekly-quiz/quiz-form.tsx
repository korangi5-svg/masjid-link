'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { primaryButton } from '@/lib/site'
import { scoreQuiz, type QuizResult } from './actions'

type Question = { prompt: string; options: string[] }

export function QuizForm({ date, questions }: { date: string; questions: Question[] }) {
  const [attempt, setAttempt] = useState(0)
  return <QuizAttempt key={attempt} date={date} questions={questions} retry={() => setAttempt(attempt + 1)} />
}

function QuizAttempt({ date, questions, retry }: { date: string; questions: Question[]; retry: () => void }) {
  const [result, submit, pending] = useActionState<QuizResult, FormData>(scoreQuiz.bind(null, date), {})
  const heading = useRef<HTMLHeadingElement>(null)
  const review = result.review

  useEffect(() => { if (review) heading.current?.focus() }, [review])

  if (review) return (
    <section aria-labelledby="quiz-results">
      <h2 id="quiz-results" tabIndex={-1} ref={heading} className="text-2xl font-bold text-navy">
        You scored {result.score} out of {questions.length}
      </h2>
      <ol className="my-6 space-y-4">
        {review.map((item, index) => (
          <li key={questions[index].prompt} className="rounded-xl border-4 border-navy bg-white p-5">
            <h3 className="font-semibold text-navy">{index + 1}. {questions[index].prompt}</h3>
            <p className="mt-2 text-sm">{item.selected === item.correct ? 'Correct' : 'Incorrect'} · Your answer: {item.selected}</p>
            {item.selected !== item.correct && <p className="text-sm">Correct answer: {item.correct}</p>}
            <p className="mt-2">{item.explanation}</p>
            <a href={item.source.href} className="mt-2 inline-block font-medium text-navy underline">{item.source.label}</a>
          </li>
        ))}
      </ol>
      <button type="button" onClick={retry} className={primaryButton}>Try again</button>
    </section>
  )

  return (
    <form action={submit} className="space-y-6">
      {questions.map(({ prompt, options }, index) => (
        <fieldset key={prompt} className="min-w-0 rounded-xl border-4 border-navy bg-white p-5">
          <legend className="px-2 font-semibold text-navy">{index + 1}. {prompt}</legend>
          <div className="space-y-2">
            {options.map((option, choice) => (
              <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-4 border-navy px-3 py-2 hover:bg-teal/5">
                <input className="shrink-0 accent-navy" type="radio" name={`question-${index}`} value={choice} required />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {result.error && <p role="alert" className="text-destructive">{result.error}</p>}
      <button className={primaryButton} disabled={pending}>{pending ? 'Scoring…' : 'Submit answers'}</button>
    </form>
  )
}
