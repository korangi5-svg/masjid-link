import { parseInterests, type Interest } from './interests'

export interface LearningResource {
  id: string
  title: string
  description: string
  href: string
  publisher: string
  format: 'Reading' | 'Course' | 'Collection'
  interests: Interest[]
}

/** Curated content only; interest matching never changes a destination URL. */
export const learningResources: LearningResource[] = [
  { id: 'quran', title: 'Read and listen to the Quran', description: 'Explore the Quran with translations and recitations.', href: 'https://quran.com', publisher: 'Quran.com', format: 'Collection', interests: ['quran'] },
  { id: 'tafsir', title: 'Tafsir Ibn Kathir', description: 'Read a classical explanation alongside the verses of the Quran.', href: 'https://quran.com/1/1/tafsirs/en-tafisr-ibn-kathir', publisher: 'Quran.com', format: 'Reading', interests: ['tafsir', 'quran'] },
  { id: 'history', title: 'Explore Islamic history', description: 'Discover resources on the Prophet’s life and Islamic heritage.', href: 'https://yaqeeninstitute.org/topic/history', publisher: 'Yaqeen Institute', format: 'Collection', interests: ['islamic-history'] },
  { id: 'parenting', title: 'Faith and family: parenting resources', description: 'Explore research and practical guidance for Muslim parents.', href: 'https://yaqeen-web.yaqeen.io/read/data/parenting', publisher: 'Yaqeen Institute', format: 'Collection', interests: ['parenting'] },
  { id: 'new-muslims', title: 'Start your learning journey', description: 'Browse introductory courses on faith, worship, and everyday Muslim life.', href: 'https://www.newmuslimacademy.org/our-courses/', publisher: 'New Muslim Academy', format: 'Course', interests: ['new-muslims'] },
  { id: 'youth', title: 'What shapes Muslim identity?', description: 'Explore the factors that help shape faith and identity in young people.', href: 'https://yaqeen-web.yaqeen.io/infographics/yaqeen-in-youth-what-shapes-muslim-identity-inforgaphic', publisher: 'Yaqeen Institute', format: 'Reading', interests: ['youth', 'parenting'] },
  { id: 'salah', title: 'Learn salah step by step', description: 'A practical introduction to performing the daily prayer.', href: 'https://www.whyislam.org/prayer', publisher: 'WhyIslam', format: 'Reading', interests: ['new-muslims', 'youth'] },
  { id: 'hadith', title: '40 Hadith of Imam Nawawi', description: 'Read a collection of foundational teachings.', href: 'https://sunnah.com/nawawi40', publisher: 'Sunnah.com', format: 'Collection', interests: ['new-muslims', 'youth'] },
]

export function recommendResources(selected: unknown, resources: LearningResource[] = learningResources) {
  const chosen = new Set(parseInterests(selected))
  const seen = new Set<string>()
  return resources
    .map((resource) => ({ ...resource, matchedInterests: resource.interests.filter((id) => chosen.has(id)) }))
    .filter((resource) => resource.matchedInterests.length > 0)
    .sort((a, b) => b.matchedInterests.length - a.matchedInterests.length || a.title.localeCompare(b.title))
    .filter((resource) => {
      if (seen.has(resource.href)) return false
      seen.add(resource.href)
      return true
    })
}
