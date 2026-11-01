export const newMuslimModules = [
  { id: 'shahadah', title: 'Shahadah', subtitle: 'Understand the testimony of faith', minutes: 5,
    overview: 'Begin with the meaning of the testimony: worship belongs to Allah alone, and Muhammad ﷺ is His messenger. Learning its meaning is a foundation for your journey.',
    paragraphs: ['The Shahadah expresses belief in Allah’s oneness and in the messengership of Muhammad ﷺ. It is a commitment of faith, not simply an Arabic phrase to memorize.', 'A common wording is: Ashhadu an la ilaha illa Allah, wa ashhadu anna Muhammadan rasul Allah. Meaning: I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the messenger of Allah.', 'Take your time understanding the words. A trusted imam or teacher can support you with questions and pronunciation. Completing this learning module is a study milestone, not a declaration of your religious status.'],
    practice: 'Explain the two parts of the testimony in your own words. Write down one question to ask a trusted teacher.',
    sources: [{ label: 'Quran 47:19 · Allah’s oneness', href: 'https://quran.com/47/19' }, { label: 'Sahih Muslim 16a · the foundations of Islam', href: 'https://sunnah.com/muslim:16a' }],
    question: 'What are the two parts of the Shahadah?', options: ['Belief in Allah’s oneness and Muhammad’s messengership', 'A promise to finish every lesson in one day', 'Learning Arabic before beginning any worship'], answer: 0,
    explanation: 'The testimony affirms Allah’s oneness and Muhammad’s messengership. Understanding grows with patient learning.' },
  { id: 'salah', title: 'Salah', subtitle: 'Build a gentle introduction to daily prayer', minutes: 6,
    overview: 'Salah is the daily ritual prayer and a foundation of Muslim worship. This module introduces its place in daily life; the next module covers wudu before practical prayer study.',
    paragraphs: ['The five daily obligatory prayers are Fajr, Dhuhr, Asr, Maghrib, and Isha. Their times follow the sun and vary with location and season.', 'Prayer brings together intention, recitation, standing when able, bowing, and prostration. Learn the movements and words gradually with a reliable teacher or beginner course.', 'Before practical prayer, learn purification, the prayer time, appropriate covering, and facing the qiblah. Wudu is introduced next. If illness, disability, or another circumstance affects your practice, ask a qualified teacher about the accommodations that apply to you.', 'Details of prayer practice differ among Islamic traditions. Follow a trusted teacher’s consistent guidance rather than mixing unfamiliar instructions.'],
    practice: 'Find the five prayer names on your local masjid’s timetable. Choose a time to ask about a beginner prayer demonstration after learning wudu.',
    sources: [{ label: 'Sahih Muslim 16a · establishing prayer', href: 'https://sunnah.com/muslim:16a' }, { label: 'Quran 5:6 · preparation for prayer', href: 'https://quran.com/5/6' }],
    question: 'Which list names the five daily prayers?', options: ['Friday, Eid, and Ramadan', 'Fajr, Dhuhr, Asr, Maghrib, and Isha', 'Only Fajr and Isha'], answer: 1,
    explanation: 'The five daily prayers are Fajr, Dhuhr, Asr, Maghrib, and Isha. Use a local timetable for their times.' },
  { id: 'wudu', title: 'Wudu', subtitle: 'Learn about purification before prayer', minutes: 6,
    overview: 'Wudu is ritual purification with water. Quran 5:6 describes preparation for prayer, including the face, arms to the elbows, head, and feet to the ankles.',
    paragraphs: ['Approach wudu with the intention of preparing for worship. Use clean water carefully and avoid waste.', 'Learn a complete demonstration from a trusted teacher. Many Sunni beginner demonstrations include washing the hands, rinsing the mouth and nose, washing the face and arms, wiping the head, and washing the feet. There are recognized differences in details and in how the feet are purified across Islamic traditions.', 'Quran 5:6 also addresses full purification and tayammum when its conditions apply. These have additional details; this introduction is not a complete ruling for every circumstance.', 'Ask your teacher what breaks wudu and how to handle situations such as injury, dressings, or difficulty using water. The aim is understanding and a manageable practice.'],
    practice: 'Read Quran 5:6, then arrange a wudu demonstration with a trusted teacher. Name the body areas mentioned in the verse.',
    sources: [{ label: 'Quran 5:6 · purification for prayer', href: 'https://quran.com/5/6' }],
    question: 'Which areas are named in Quran 5:6 for preparation with water?', options: ['Only the hands', 'Only the face and hair', 'The face, arms to the elbows, head, and feet to the ankles'], answer: 2,
    explanation: 'The verse names these areas. Learn the complete practice and relevant details with a trusted teacher.' },
  { id: 'quran-basics', title: 'Quran Basics', subtitle: 'Begin reading, listening, and understanding', minutes: 5,
    overview: 'The Quran is central to Muslim faith and worship. Begin with attentive listening, a reliable translation, and small steps in Arabic reading.',
    paragraphs: ['The Quran is arranged into surahs (chapters) and ayahs (verses). A reference such as 73:4 means surah 73, verse 4.', 'A translation helps you explore meaning but does not replace the Arabic Quran. Different translators make different wording choices; read verses in context and seek explanation when something is unclear.', 'Quran 73:4 directs measured recitation in a passage about night prayer. Start slowly and listen to a reliable reciter. A teacher can help with pronunciation and tajwid.', 'You do not need to master everything at once. A short, regular practice can combine listening, reading a translation, and asking one thoughtful question.'],
    practice: 'Open Al-Fatihah (surah 1), listen once, and read a translation. Choose a regular five-minute learning time.',
    sources: [{ label: 'Quran 73:4 · measured recitation', href: 'https://quran.com/73/4' }, { label: 'Al-Fatihah · listen and read', href: 'https://quran.com/1' }],
    question: 'What does the reference 73:4 identify?', options: ['Page 73, chapter 4 in every printed Quran', 'Surah 73, verse 4', 'A required number of daily repetitions'], answer: 1,
    explanation: 'Quran references identify the surah and verse. Printed page numbers can vary by edition.' },
] as const

export type PathProgress = { completed: string[] }
/** Accept only a contiguous prefix; unknown, duplicate, or out-of-order IDs cannot unlock modules. */
export function parsePathProgress(value: unknown): PathProgress {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const completed: string[] = []
  if (Array.isArray(raw.completed)) for (const module of newMuslimModules) {
    if (!raw.completed.includes(module.id)) break
    completed.push(module.id)
  }
  return { completed }
}
export function completePathModule(value: unknown, moduleId: unknown, answer: unknown): PathProgress {
  const progress = parsePathProgress(value)
  const index = newMuslimModules.findIndex(module => module.id === moduleId)
  if (index < 0) throw new Error('Unknown module.')
  if (index > progress.completed.length) throw new Error('Complete the previous module first.')
  if (!Number.isInteger(answer) || answer !== newMuslimModules[index].answer) throw new Error('Review the lesson and try the knowledge check again.')
  if (index === progress.completed.length) progress.completed.push(newMuslimModules[index].id)
  return progress
}
