import { contentCatalog, scholars } from './recommendations'

const prayerTopics = [
  { id: 'salah', title: 'Salah', related: ['wudu', 'khushu', 'prayer-fiqh'] },
  { id: 'wudu', title: 'Wudu', related: ['salah', 'prayer-fiqh'] },
  { id: 'khushu', title: 'Khushu', related: ['salah'] },
  { id: 'prayer-fiqh', title: 'Fiqh of Prayer', related: ['salah', 'wudu'] },
] as const

type TopicId = (typeof prayerTopics)[number]['id']

const resourceTopics: Partial<Record<string, readonly TopicId[]>> = {
  salah: ['salah'],
  'focus-in-salah': ['khushu', 'salah'],
}

const topicResources: Record<TopicId, { title: string; href: string; type: string }> = {
  salah: { title: 'Salah', href: '/learning-path', type: 'Course' },
  wudu: { title: 'Wudu', href: '/learning-path', type: 'Course' },
  khushu: { title: 'Khushu', href: 'https://yaqeeninstitute.org/watch/series/secrets-of-salah-dhul-hijjah-2025/how-to-master-your-focus-in-salah-deep-dive-dhul-hijjah-series-2025', type: 'Lecture' },
  'prayer-fiqh': { title: 'Fiqh of Prayer · The Book of Prayer', href: 'https://sunnah.com/muslim/4', type: 'Book' },
}

export function relatedLearning(resourceId: string) {
  const source = resourceTopics[resourceId]
  if (!source) return { topics: [], resources: [], scholars: [] }

  const topicIds = new Set<TopicId>(source)
  for (const topic of prayerTopics) {
    if (source.includes(topic.id)) for (const related of topic.related) topicIds.add(related)
  }

  const topics = prayerTopics.filter(topic => topicIds.has(topic.id) && !source.includes(topic.id))
    .map(topic => topicResources[topic.id])
  const resources = contentCatalog.filter(item => item.id !== resourceId && resourceTopics[item.id]?.some(topic => topicIds.has(topic)))
  const people = new Set(resources.flatMap(item => item.scholarIds))
  return { topics, resources, scholars: scholars.filter(scholar => people.has(scholar.id)) }
}
