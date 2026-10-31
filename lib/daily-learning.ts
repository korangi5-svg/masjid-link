export const dailyThemes = ['Steady steps', 'Sincere intentions', 'Gentleness', 'Learning', 'Hope', 'Family kindness', 'Community'] as const
export function learningDate(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function dailyPreferences(value: unknown) {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return { email: raw.email === true, inApp: raw.inApp !== false, readDate: typeof raw.readDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.readDate) ? raw.readDate : '' }
}
const verses = [
  { arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', meaning: 'So, surely with hardship comes ease.', reference: 'Ash-Sharh 94:5', href: 'https://quran.com/94/5', context: 'This reassurance appears in a surah addressing the Prophet ﷺ. Read verses 1–8 for the surrounding message.' },
  { arabic: 'فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ ۗ وَلَا تَعْجَلْ بِالْقُرْآنِ مِنْ قَبْلِ أَنْ يُقْضَىٰ إِلَيْكَ وَحْيُهُ ۖ وَقُلْ رَبِّ زِدْنِي عِلْمًا', meaning: 'Meaning in brief: Allah is the True King. The Prophet is instructed not to rush the revelation, and to ask his Lord for more knowledge.', reference: 'Ta-Ha 20:114', href: 'https://quran.com/20/114', context: 'The verse addresses receiving revelation. Its closing prayer offers a simple way to approach learning with humility.' },
  { arabic: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُمْ مِنْ ذَكَرٍ وَأُنْثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا ۚ إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ ۚ إِنَّ اللَّهَ عَلِيمٌ خَبِيرٌ', meaning: 'Meaning in brief: Humanity shares a common origin. Peoples and tribes are to know one another; honor before Allah rests on righteousness.', reference: 'Al-Hujurat 49:13', href: 'https://quran.com/49/13', context: 'Read alongside verses 11–12, which warn against ridicule, suspicion, and backbiting.' },
]
const hadiths = [
  { meaning: 'Meaning in brief: Practice good deeds sincerely and moderately. The deeds most beloved to Allah are those maintained consistently, even when small.', reference: 'Sahih al-Bukhari 6464 · Sahih collection', href: 'https://sunnah.com/bukhari:6464' },
  { meaning: 'Meaning in brief: The reward of an action depends on the intention behind it. A person receives according to what they intended.', reference: 'Sahih al-Bukhari 1 · Sahih collection', href: 'https://sunnah.com/bukhari:1' },
  { meaning: 'Meaning in brief: Allah loves gentleness and grants through gentleness what He does not grant through harshness.', reference: 'Sahih Muslim 2593 · Sahih collection', href: 'https://sunnah.com/muslim:2593' },
]
const practices = [
  ['Choose a habit small enough to repeat on a difficult day. Consistency can begin with one attentive minute.', 'Which small practice can I sustain this week?', 'Read one verse slowly and return to it tomorrow.'],
  ['A useful action can begin with a quiet intention. Pause before a routine task and connect it to service and care.', 'What intention is shaping my next action?', 'Before your next task, name one good purpose for doing it.'],
  ['Gentleness can guide both your words and your pace. Listen fully before offering a correction.', 'Where could I respond more gently today?', 'Offer one calm, specific word of encouragement.'],
  ['Learning grows through careful attention and patient questions. It is fine to leave a question open until you find a reliable explanation.', 'What would I like to understand more clearly?', 'Write down one question and read the linked verse in context.'],
  ['Hope and practical effort can exist together. Acknowledge a difficulty, then choose one helpful step within your reach.', 'What support or small next step is available to me?', 'Ask for help with one manageable concern.'],
  ['Kindness at home often appears in ordinary moments. Give someone your full attention without preparing your reply.', 'Who at home would benefit from my attention?', 'Help with one household task without waiting to be asked.'],
  ['Community begins with knowing and respecting people. Shared spaces offer opportunities to welcome someone beyond your usual circle.', 'Who might feel unseen in my community?', 'Greet someone warmly or ask how you can help.'],
] as const
export function dailyLesson(interests: unknown = [], now = Date.now()) {
  const date = learningDate(now)
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000)
  const index = ((day % 7) + 7) % 7
  const family = Array.isArray(interests) && interests.includes('parenting')
  const foundation = Array.isArray(interests) && interests.includes('new-muslims')
  const practice = practices[index]
  return { date, title: dailyThemes[index], verse: verses[index % 3], hadith: hadiths[index % 3],
    dua: { arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni ilma', meaning: 'My Lord! Increase me in knowledge.', reference: 'Ta-Ha 20:114 · closing prayer', href: 'https://quran.com/20/114', use: 'A Quranic prayer to use when seeking knowledge; no fixed repetition count is prescribed here.' },
    reflection: practice[1], lesson: practice[0], action: family ? `${practice[2]} Invite a family member to share what they noticed.` : foundation ? `${practice[2]} Keep it simple and take one step at a time.` : practice[2],
    reason: family ? 'A family practice, shaped by your Parenting interest.' : foundation ? 'A gentle starting point, shaped by your New Muslims interest.' : 'A short practice for your daily learning.',
  }
}
export function dailyEmailText(lesson: ReturnType<typeof dailyLesson>) {
  return `Daily Islamic Learning — ${lesson.date}\n${lesson.title}\n${lesson.reason}\n\nQURAN VERSE\n${lesson.verse.arabic}\n${lesson.verse.meaning}\n${lesson.verse.reference}\n${lesson.verse.href}\n${lesson.verse.context}\n\nHADITH\n${lesson.hadith.meaning}\n${lesson.hadith.reference}\n${lesson.hadith.href}\n\nDUA\n${lesson.dua.arabic}\n${lesson.dua.transliteration}\n${lesson.dua.meaning}\n${lesson.dua.reference}\n${lesson.dua.href}\n\nREFLECTION\n${lesson.reflection}\n\nSHORT LESSON\n${lesson.lesson}\nToday's action: ${lesson.action}\n\nScripture meanings are summarized except 94:5 and the dua, translated by Dr. Mustafa Khattab, The Clear Quran. Reflections are editorial learning prompts. Our seven-day starter cycle revisits texts for practice.\n\nRead and manage daily emails: https://masjid-link.vercel.app/daily-learning\nTurn off daily email there at any time.\n`
}
