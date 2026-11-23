import Link from 'next/link'
import { getPublishedQuizzes, quizDateLabel } from '@/lib/weekly-quiz'
import { DailyQuiz } from './daily-quiz'
import { QuizForm } from './quiz-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Weekly Islamic Quiz', description: 'Take a daily mixed-topic quiz or test your Islamic knowledge with the weekly quiz.' }

export default function WeeklyQuizPage() {
  const now = new Date()
  const [quiz] = getPublishedQuizzes(now)
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/daily-learning" className="text-sm font-semibold text-navy underline">Back to Daily Learning</Link>
      <h1 className="mt-5 text-3xl font-bold text-navy sm:text-4xl">Weekly Islamic Quiz</h1>
      <nav aria-label="Quizzes" className="my-6 flex flex-wrap gap-4">
        <a className="font-semibold text-navy underline" href="#daily-quiz">Daily Quiz</a>
        <a className="font-semibold text-navy underline" href="#weekly-quiz">Weekly Quiz</a>
      </nav>
      <section id="daily-quiz" aria-labelledby="daily-quiz-title" className="mb-10 scroll-mt-6 rounded-2xl border-4 border-navy p-4 sm:p-6">
        <h2 id="daily-quiz-title" className="text-2xl font-bold text-navy">Daily Quiz</h2>
        <p className="mt-2 text-sm text-muted-foreground"><time dateTime={today}>{quizDateLabel(today)}</time></p>
        <p className="mb-4 mt-2">Four questions covering science, history, math, and Islamic knowledge.</p>
        <DailyQuiz key={today} date={today} />
      </section>
      <section id="weekly-quiz" aria-labelledby="weekly-quiz-title" className="scroll-mt-6 rounded-2xl border-4 border-navy p-4 sm:p-6">
        <h2 id="weekly-quiz-title" className="text-2xl font-bold text-navy">Weekly Quiz</h2>
        {quiz ? (
          <>
            <h3 className="mt-3 text-xl font-semibold text-navy">{quiz.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Published <time dateTime={quiz.date}>{quizDateLabel(quiz.date)}</time>
            </p>
            <p className="mb-8 mt-3">Choose one answer for each question. Submit to see your score, explanations, and sources.</p>
            <QuizForm key={quiz.date} date={quiz.date} questions={quiz.questions.map(({ prompt, options }) => ({ prompt, options }))} />
          </>
        ) : <p className="mt-4">The first quiz will be available soon.</p>}
      </section>
    </div>
  )
}
