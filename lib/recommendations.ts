import { parseInterests, type Interest } from './interests'

export interface LearningResource {
  id: string
  title: string
  description: string
  href: string
  publisher: string
  format: 'Reading' | 'Course' | 'Collection'
  interests: Interest[]
  kind?: 'article' | 'lecture' | 'course' | 'podcast'
  scholarIds?: string[]
  /** Date this item was first published to Masjid Link; omit for undated legacy resources. */
  publishedAt?: string
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

export const scholars = [
  { id: 'omar-suleiman', name: 'Dr. Omar Suleiman', description: 'Lectures and podcasts from Yaqeen Institute.' },
  { id: 'nouman-ali-khan', name: 'Ustadh Nouman Ali Khan', description: 'Quran and Arabic learning from Bayyinah.' },
] as const

export const contentKinds = ['article', 'lecture', 'course', 'podcast'] as const
export type ContentKind = (typeof contentKinds)[number]
export type CatalogResource = LearningResource & { kind: ContentKind; scholarIds: string[] }

/** Source links are curated; activity can rank them but cannot generate new URLs. */
export const contentCatalog: CatalogResource[] = [
  ...learningResources.map((resource): CatalogResource => ({ ...resource, kind: resource.format === 'Course' ? 'course' : 'article', scholarIds: [] })),
  { id: 'quran-30-lectures', title: 'Qur’an 30 for 30', description: 'Watch reflections on the Quran with Omar Suleiman and guests.', href: 'https://yaqeeninstitute.org/series/quran-30-for-30', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'lecture', interests: ['quran', 'tafsir'], scholarIds: ['omar-suleiman'] },
  { id: 'quran-30-season5', title: 'Qur’an 30 for 30 · Season 5', description: 'Explore another season of Quranic reflections and discussions.', href: 'https://yaqeeninstitute.org/series/quran-30-for-30-season-5', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'lecture', interests: ['quran', 'tafsir'], scholarIds: ['omar-suleiman'] },
  { id: 'bayyinah-courses', title: 'Quran and Arabic with Bayyinah', description: 'Explore Quran and Arabic courses taught by Nouman Ali Khan. Publisher membership may be required.', href: 'https://bayyinah.tv/', publisher: 'Bayyinah', format: 'Course', kind: 'course', interests: ['quran', 'tafsir'], scholarIds: ['nouman-ali-khan'] },
  { id: 'firsts-podcast', title: 'The Firsts', description: 'Listen to Omar Suleiman’s series on the trailblazers of Islam.', href: 'https://yaqeeninstitute.org/listen/the-firsts', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'podcast', interests: ['islamic-history', 'new-muslims', 'youth'], scholarIds: ['omar-suleiman'] },
  { id: 'quran-30-podcast', title: 'Qur’an 30 for 30 · Podcast', description: 'Listen to conversations and reflections on the Quran.', href: 'https://app.yaqeen.io/listen/quran-30-for-30', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'podcast', interests: ['quran', 'tafsir'], scholarIds: ['omar-suleiman'] },
  { id: 'parenting-webinar', title: 'How to Raise Muslim Children', description: 'Watch a panel discussion on parenting and raising Muslim children.', href: 'https://yaqeeninstitute.org/watch/webinar-video/how-to-raise-muslim-children-webinar', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'lecture', interests: ['parenting', 'youth'], scholarIds: [] },
  { id: 'doubletake', title: 'DoubleTake · A Yaqeen Podcast', description: 'Conversations about questions of faith and everyday Muslim life.', href: 'https://yaqeeninstitute.org/listen/doubletake', publisher: 'Yaqeen Institute', format: 'Collection', kind: 'podcast', interests: ['new-muslims', 'youth'], scholarIds: [] },
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
