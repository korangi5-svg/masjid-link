import Link from 'next/link'
import { getPublishedQuizzes, quizDateLabel } from '@/lib/weekly-quiz'
import { QuizForm } from './quiz-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Weekly Islamic Quiz', description: 'Test your Islamic knowledge with five sourced questions.' }

export default function WeeklyQuizPage() {
  const [quiz] = getPublishedQuizzes()
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/daily-learning" className="text-sm font-semibold text-navy underline">Back to Daily Learning</Link>
      <h1 className="mt-5 text-3xl font-bold text-navy sm:text-4xl">Weekly Islamic Quiz</h1>
      {quiz ? (
        <>
          <h2 className="mt-3 text-xl font-semibold text-navy">{quiz.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Published <time dateTime={quiz.date}>{quizDateLabel(quiz.date)}</time>
          </p>
          <p className="mb-8 mt-3">Choose one answer for each question. Submit to see your score, explanations, and sources.</p>
          <QuizForm key={quiz.date} date={quiz.date} questions={quiz.questions.map(({ prompt, options }) => ({ prompt, options }))} />
        </>
      ) : <p className="mt-4">The first quiz will be available soon.</p>}
    </div>
  )
}
