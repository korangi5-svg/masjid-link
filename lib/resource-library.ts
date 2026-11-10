import type { ResourceCategory } from './types'

const topics = [
  { tag: 'Quran', category: 'quran', pattern: /\b(qur.?an|tafsir|recitations?)\b/i },
  { tag: 'Hadith', category: 'hadith', pattern: /\b(hadith|nawawi)\b/i },
  { tag: 'Dua', category: 'dua', pattern: /\b(du.?as?|supplications?|adhkar|remembrances?)\b/i },
  { tag: 'Prayer', category: 'education', pattern: /\b(salah|prayers?)\b/i },
  { tag: 'Arabic', pattern: /\barabic\b/i },
  { tag: 'English', pattern: /\benglish\b/i },
  { tag: 'Beginners', pattern: /\b(beginners?|new muslims?)\b/i },
  { tag: 'Family', pattern: /\b(famil(y|ies)|parenting)\b/i },
  { tag: 'Community', pattern: /\bcommunity\b/i },
] as const

export function indexResources(categories: ResourceCategory[]) {
  const titles = new Map(categories.map(({ id, title }) => [id, title]))
  const resources = categories.flatMap((group) => group.links.map((link) => {
    const text = link.title + ' ' + link.description
    const matches = topics.filter(({ pattern }) => pattern.test(text))
    const classified = matches.find((topic) => 'category' in topic && titles.has(topic.category))
    const category = classified && 'category' in classified ? classified.category : group.id
    const tags = matches.map(({ tag }) => tag)
    return {
      ...link,
      category,
      tags,
      searchText: [text, titles.get(category), ...tags].join(' ').toLowerCase(),
    }
  }))

  return resources.map((resource) => ({
    ...resource,
    related: resources
      .filter((candidate) => candidate.href !== resource.href)
      .map((candidate) => ({
        title: candidate.title,
        href: candidate.href,
        score: resource.tags.filter((tag) => candidate.tags.includes(tag)).length * 2
          + Number(candidate.category === resource.category),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
  }))
}
