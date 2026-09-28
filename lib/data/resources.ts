import type { ResourceCategory } from '@/lib/types'

export const mockResources: ResourceCategory[] = [
  {
    id: 'quran',
    title: 'Quran',
    description: 'Read, listen to, and reflect on the Quran with translations and tafsir.',
    links: [
      { title: 'Quran.com', description: 'Read the Quran with translations and recitations.', href: 'https://quran.com' },
      { title: 'Tafsir Ibn Kathir', description: 'Classical explanation of the Quran.', href: 'https://quran.com/1/1/tafsirs/en-tafisr-ibn-kathir' },
    ],
  },
  {
    id: 'hadith',
    title: 'Hadith',
    description: 'Explore authentic collections of the sayings and actions of the Prophet ﷺ.',
    links: [
      { title: 'Sunnah.com', description: 'Searchable hadith collections in Arabic and English.', href: 'https://sunnah.com' },
      { title: '40 Hadith of Imam Nawawi', description: 'Foundational hadith every Muslim should know.', href: 'https://sunnah.com/nawawi40' },
    ],
  },
  {
    id: 'dua',
    title: 'Dua',
    description: 'Supplications for every moment of the day, from morning to night.',
    links: [
      { title: 'Hisn al-Muslim', description: 'Fortress of the Muslim — daily supplications.', href: 'https://sunnah.com/hisn' },
      { title: 'Morning & Evening Adhkar', description: 'Remembrances to begin and end each day.', href: 'https://sunnah.com/hisn:75' },
    ],
  },
  {
    id: 'articles',
    title: 'Islamic Articles',
    description: 'Thoughtful writing on faith, family, character, and community life.',
    links: [
      { title: 'Yaqeen Institute', description: 'Research-based articles on Islam.', href: 'https://yaqeeninstitute.org/read' },
      { title: 'Muslim Matters', description: 'Commentary on faith and community.', href: 'https://muslimmatters.org' },
    ],
  },
  {
    id: 'education',
    title: 'Educational Resources',
    description: 'Courses and learning paths for new Muslims, youth, and lifelong learners.',
    links: [
      { title: 'Arabic for Beginners', description: 'Start reading and understanding Arabic.', href: 'https://www.madinaharabic.com' },
      { title: 'Learn Salah Step by Step', description: 'A guide to performing the prayer.', href: 'https://www.whyislam.org/prayer' },
    ],
  },
]
