import 'server-only'

const quizzes = [
  {
    "date": "2026-11-16",
    "title": "The Five Daily Prayers",
    "questions": [
      {
        "prompt": "How many obligatory prayers are there each day?",
        "options": [
          "Three",
          "Four",
          "Five",
          "Six"
        ],
        "answer": 2,
        "explanation": "Muslims observe five obligatory prayers each day.",
        "source": {
          "label": "Sahih Muslim 16a",
          "href": "https://sunnah.com/muslim:16a"
        }
      },
      {
        "prompt": "Which obligatory prayer is performed at dawn?",
        "options": [
          "Fajr",
          "Dhuhr",
          "Maghrib",
          "Isha"
        ],
        "answer": 0,
        "explanation": "Fajr is the dawn prayer. Its time ends at sunrise.",
        "source": {
          "label": "Sahih Muslim 612a",
          "href": "https://sunnah.com/muslim:612a"
        }
      },
      {
        "prompt": "Which prayer begins at sunset?",
        "options": [
          "Asr",
          "Isha",
          "Dhuhr",
          "Maghrib"
        ],
        "answer": 3,
        "explanation": "Maghrib is the sunset prayer.",
        "source": {
          "label": "Sahih Muslim 612a",
          "href": "https://sunnah.com/muslim:612a"
        }
      },
      {
        "prompt": "What is the direction of prayer called?",
        "options": [
          "Adhan",
          "Qiblah",
          "Wudu",
          "Iqamah"
        ],
        "answer": 1,
        "explanation": "The qiblah is the direction Muslims face in prayer, toward the Sacred Mosque in Mecca.",
        "source": {
          "label": "Quran 2:144",
          "href": "https://quran.com/2/144"
        }
      },
      {
        "prompt": "What is ritual washing with water before prayer called?",
        "options": [
          "Salah",
          "Qiblah",
          "Wudu",
          "Adhan"
        ],
        "answer": 2,
        "explanation": "Wudu is ritual washing with water. Quran 5:6 describes it in connection with preparing for prayer.",
        "source": {
          "label": "Quran 5:6",
          "href": "https://quran.com/5/6"
        }
      }
    ]
  },
  {
    "date": "2026-11-23",
    "title": "Getting to Know the Quran",
    "questions": [
      {
        "prompt": "Which surah opens the Quran?",
        "options": [
          "Al-Ikhlas",
          "Al-Fatihah",
          "Al-Baqarah",
          "An-Nas"
        ],
        "answer": 1,
        "explanation": "Al-Fatihah is the first surah of the Quran.",
        "source": {
          "label": "Surah Al-Fatihah",
          "href": "https://quran.com/1"
        }
      },
      {
        "prompt": "How many verses are in Surah Al-Fatihah?",
        "options": [
          "Four",
          "Five",
          "Six",
          "Seven"
        ],
        "answer": 3,
        "explanation": "Surah Al-Fatihah contains seven verses.",
        "source": {
          "label": "Surah Al-Fatihah",
          "href": "https://quran.com/1"
        }
      },
      {
        "prompt": "Which surah begins by declaring that Allah is One?",
        "options": [
          "An-Nas",
          "Al-Fatihah",
          "Al-Ikhlas",
          "Al-Qadr"
        ],
        "answer": 2,
        "explanation": "Surah Al-Ikhlas opens with a declaration of Allah’s oneness.",
        "source": {
          "label": "Quran 112:1",
          "href": "https://quran.com/112/1"
        }
      },
      {
        "prompt": "What does the Quran describe as better than a thousand months?",
        "options": [
          "Laylat al-Qadr",
          "The month of Shawwal",
          "The day of Friday",
          "The month of Muharram"
        ],
        "answer": 0,
        "explanation": "Surah Al-Qadr describes Laylat al-Qadr as better than a thousand months.",
        "source": {
          "label": "Quran 97:3",
          "href": "https://quran.com/97/3"
        }
      },
      {
        "prompt": "Which surah appears last in the Quran?",
        "options": [
          "Al-Ikhlas",
          "Al-Falaq",
          "Al-Fatihah",
          "An-Nas"
        ],
        "answer": 3,
        "explanation": "An-Nas is the 114th and final surah in the Quran.",
        "source": {
          "label": "Surah An-Nas",
          "href": "https://quran.com/114"
        }
      }
    ]
  },
  {
    "date": "2026-11-30",
    "title": "Fasting and Ramadan",
    "questions": [
      {
        "prompt": "In which month was the Quran revealed, according to Quran 2:185?",
        "options": [
          "Muharram",
          "Ramadan",
          "Shawwal",
          "Rajab"
        ],
        "answer": 1,
        "explanation": "Quran 2:185 identifies Ramadan as the month in which the Quran was revealed.",
        "source": {
          "label": "Quran 2:185",
          "href": "https://quran.com/2/185"
        }
      },
      {
        "prompt": "What purpose of fasting is given in Quran 2:183?",
        "options": [
          "To learn a new language",
          "To mark the start of the year",
          "To grow in mindfulness of Allah",
          "To mark the end of Hajj"
        ],
        "answer": 2,
        "explanation": "Quran 2:183 connects fasting with developing taqwa, or mindfulness of Allah.",
        "source": {
          "label": "Quran 2:183",
          "href": "https://quran.com/2/183"
        }
      },
      {
        "prompt": "When does the daily Ramadan fast begin?",
        "options": [
          "At dawn",
          "At sunrise",
          "At noon",
          "At sunset"
        ],
        "answer": 0,
        "explanation": "Quran 2:187 describes the start of the fast at dawn.",
        "source": {
          "label": "Quran 2:187",
          "href": "https://quran.com/2/187"
        }
      },
      {
        "prompt": "When does the daily Ramadan fast end?",
        "options": [
          "At dawn",
          "At noon",
          "At mid-afternoon",
          "At sunset"
        ],
        "answer": 3,
        "explanation": "Quran 2:187 instructs believers to complete the fast until nightfall.",
        "source": {
          "label": "Quran 2:187",
          "href": "https://quran.com/2/187"
        }
      },
      {
        "prompt": "What does Quran 2:185 say about fasts missed because of illness or travel?",
        "options": [
          "Make up the same number on other days",
          "Repeat the entire month",
          "Make them up only on Fridays",
          "Wait for the next Ramadan"
        ],
        "answer": 0,
        "explanation": "The verse specifies making up an equal number of days later.",
        "source": {
          "label": "Quran 2:185",
          "href": "https://quran.com/2/185"
        }
      }
    ]
  }
]

export function getPublishedQuizzes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const { year, month, day } = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const today = [year, month, day].join('-')
  return quizzes.filter(quiz => quiz.date <= today).sort((a, b) => b.date.localeCompare(a.date))
}

export function quizDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date))
}
