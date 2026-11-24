'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { primaryButton } from '@/lib/site'

type Question = {
  prompt: string
  options: [string, string, string, string]
  answer: number
  explanation: string
}

const science: Question[] = [
  { prompt: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answer: 1, explanation: 'Iron-rich dust gives Mars its reddish color.' },
  { prompt: 'Which organ pumps blood around the body?', options: ['Heart', 'Lungs', 'Brain', 'Liver'], answer: 0, explanation: 'The heart pumps blood through your blood vessels.' },
  { prompt: 'Which planet is closest to the Sun?', options: ['Earth', 'Venus', 'Mars', 'Mercury'], answer: 3, explanation: 'Mercury has the closest orbit to the Sun.' },
  { prompt: 'What gas do plants take in for photosynthesis?', options: ['Oxygen', 'Helium', 'Carbon dioxide', 'Hydrogen'], answer: 2, explanation: 'Plants use carbon dioxide, water, and light to make sugars.' },
  { prompt: 'What is the chemical formula for water?', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], answer: 1, explanation: 'Each water molecule contains two hydrogen atoms and one oxygen atom.' },
  { prompt: 'What force keeps the Moon in orbit around Earth?', options: ['Magnetism', 'Friction', 'Gravity', 'Air pressure'], answer: 2, explanation: 'Earth’s gravity pulls the Moon toward Earth as the Moon moves along its orbit.' },
  { prompt: 'Which of these animals is a mammal?', options: ['Shark', 'Octopus', 'Salmon', 'Dolphin'], answer: 3, explanation: 'Dolphins breathe air and nurse their young with milk.' },
]

const history: Question[] = [
  { prompt: 'Who was the first President of the United States?', options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Abraham Lincoln'], answer: 2, explanation: 'George Washington took office in 1789.' },
  { prompt: 'In which country were the ancient Olympic Games held?', options: ['Italy', 'Greece', 'Egypt', 'France'], answer: 1, explanation: 'The ancient Olympic Games were held at Olympia in Greece.' },
  { prompt: 'In which country is the Great Pyramid of Giza?', options: ['Egypt', 'Greece', 'Iraq', 'Mexico'], answer: 0, explanation: 'The Great Pyramid stands at Giza, near Cairo, Egypt.' },
  { prompt: 'Who was the first person to walk on the Moon?', options: ['Yuri Gagarin', 'Buzz Aldrin', 'John Glenn', 'Neil Armstrong'], answer: 3, explanation: 'Neil Armstrong stepped onto the Moon during Apollo 11 in 1969.' },
  { prompt: 'In which year did Canadian Confederation take place?', options: ['1812', '1867', '1914', '1982'], answer: 1, explanation: 'Canadian Confederation took place on July 1, 1867.' },
  { prompt: 'In which city was the Colosseum built?', options: ['Athens', 'Madrid', 'Rome', 'Paris'], answer: 2, explanation: 'The Colosseum is an ancient Roman amphitheatre in Rome.' },
  { prompt: 'Who was the first woman to fly solo across the Atlantic?', options: ['Amelia Earhart', 'Bessie Coleman', 'Sally Ride', 'Valentina Tereshkova'], answer: 0, explanation: 'Amelia Earhart completed the flight in 1932.' },
]

const islamic: Question[] = [
  { prompt: 'In which month do Muslims observe the daily fast from dawn to sunset?', options: ['Muharram', 'Shawwal', 'Rajab', 'Ramadan'], answer: 3, explanation: 'Ramadan is the month of fasting. See Surah Al-Baqarah, verses 185 and 187.' },
  { prompt: 'How many obligatory prayers are there each day?', options: ['Three', 'Five', 'Six', 'Seven'], answer: 1, explanation: 'Muslims observe five obligatory prayers each day. See Sahih Muslim 16a.' },
  { prompt: 'Which surah opens the Quran?', options: ['Al-Ikhlas', 'An-Nas', 'Al-Fatihah', 'Al-Baqarah'], answer: 2, explanation: 'Al-Fatihah is the opening surah of the Quran.' },
  { prompt: 'What is ritual washing with water before prayer called?', options: ['Wudu', 'Adhan', 'Qiblah', 'Iqamah'], answer: 0, explanation: 'Wudu is ritual washing with water. See Surah Al-Ma’idah, verse 6.' },
  { prompt: 'Which of the five daily prayers begins at sunset?', options: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib'], answer: 3, explanation: 'Maghrib is the sunset prayer. See Sahih Muslim 612a.' },
  { prompt: 'What is the direction Muslims face in prayer called?', options: ['Adhan', 'Qiblah', 'Wudu', 'Salah'], answer: 1, explanation: 'The qiblah is the direction toward the Kaaba. See Surah Al-Baqarah, verse 144.' },
  { prompt: 'Which surah is last in the Quran?', options: ['Al-Falaq', 'Al-Ikhlas', 'An-Nas', 'Al-Fatihah'], answer: 2, explanation: 'An-Nas is the 114th and final surah of the Quran.' },
]

function questionsForDate(date: string) {
  const day = Math.round((Date.parse(date) - Date.UTC(2026, 10, 17)) / 86_400_000)
  const rotation = ((day % science.length) + science.length) % science.length
  const total = 200 + 4 * (((day % 101) + 101) % 101)
  const quarter = total / 4
  const math: Question = {
    prompt: `What is 25% of ${total}?`,
    options: [String(quarter / 2), String(quarter - 10), String(quarter), String(quarter + 25)],
    answer: 2,
    explanation: `25% is one quarter. ${total} divided by 4 is ${quarter}.`,
  }
  return [
    { ...science[rotation], topic: 'Science' },
    { ...history[rotation], topic: 'History' },
    { ...math, topic: 'Mathematics' },
    { ...islamic[rotation], topic: 'Islamic Knowledge' },
  ]
}

export function DailyQuiz({ date }: { date: string }) {
  const questions = questionsForDate(date)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const question = questions[step]
  const checked = answers[step] !== undefined

  useEffect(() => {
    if (step > 0) heading.current?.focus()
  }, [step])

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checked) {
      setSelected(null)
      setStep(step + 1)
    } else if (selected !== null) {
      setAnswers([...answers, selected])
    }
  }

  if (!question) {
    const score = questions.filter((item, index) => item.answer === answers[index]).length
    return (
      <div className="space-y-4 rounded-xl border bg-white p-5">
        <h3 ref={heading} tabIndex={-1} className="text-xl font-bold text-navy">You scored {score} out of {questions.length}</h3>
        <ol className="space-y-3">
          {questions.map((item, index) => (
            <li key={item.topic}>
              <p className="font-semibold text-navy">{item.topic} · {answers[index] === item.answer ? 'Correct' : 'Incorrect'}</p>
              <p>{item.explanation}</p>
            </li>
          ))}
        </ol>
        <button type="button" className={primaryButton} onClick={() => {
          setAnswers([])
          setSelected(null)
          setStep(0)
        }}>Try again</button>
      </div>
    )
  }

  return (
    <form onSubmit={advance} className="space-y-4 rounded-xl border bg-white p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Question {step + 1} of {questions.length} · {question.topic}</p>
        <progress aria-label="Questions answered" className="w-full accent-navy" value={answers.length} max={questions.length} />
      </div>
      <h3 ref={heading} tabIndex={-1} id="daily-quiz-question" className="text-lg font-semibold text-navy">{question.prompt}</h3>
      <fieldset aria-labelledby="daily-quiz-question" disabled={checked} className="space-y-2">
        {question.options.map((option, choice) => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 has-[:checked]:bg-teal/10">
            <input type="radio" className="shrink-0 accent-navy" name="daily-answer" checked={selected === choice} onChange={() => setSelected(choice)} />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div role="status">
        {checked && (
          <p>
            <strong>{answers[step] === question.answer ? 'Correct! ' : `Correct answer · ${question.options[question.answer]}. `}</strong>
            {question.explanation}
          </p>
        )}
      </div>
      <button className={primaryButton} disabled={selected === null}>
        {checked ? (step + 1 === questions.length ? 'See score' : 'Next question') : 'Check answer'}
      </button>
    </form>
  )
}
