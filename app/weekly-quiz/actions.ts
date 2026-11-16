'use server'

import { getPublishedQuizzes } from '@/lib/weekly-quiz'

export type QuizResult = {
  error?: string
  score?: number
  review?: { selected: string; correct: string; explanation: string; source: { label: string; href: string } }[]
}

export async function scoreQuiz(date: string, _previous: QuizResult, form: FormData): Promise<QuizResult> {
  const quiz = getPublishedQuizzes().find(item => item.date === date)
  if (!quiz) return { error: 'This quiz is unavailable. Refresh the page to try the current quiz.' }

  const choices = quiz.questions.map((question, index) => {
    const value = form.get(`question-${index}`)
    return typeof value === 'string' && /^[0-3]$/.test(value) && Number(value) < question.options.length
      ? Number(value) : -1
  })
  if (choices.includes(-1)) return { error: 'Choose one answer for every question.' }

  return {
    score: quiz.questions.filter((question, index) => question.answer === choices[index]).length,
    review: quiz.questions.map((question, index) => ({
      selected: question.options[choices[index]],
      correct: question.options[question.answer],
      explanation: question.explanation,
      source: question.source,
    })),
  }
}
