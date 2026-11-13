import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { normalizeQuestion, routeQuestion } from '@/lib/questions'
import { getQuestionCatalog } from '@/lib/services/question-catalog'
import { geocodeLocation } from '@/lib/services/geocoding'
import { searchMasjidsNearby } from '@/lib/services/masjids'
import { getPrayerTimes } from '@/lib/services/prayer-times'
import { navLinks } from '@/lib/site'

type Link = { label: string; href: string }
const pages = [
  ...navLinks.filter(page => page.href !== '/'),
  { label: 'Learning Library', href: '/learn' },
  { label: 'New Muslim Path', href: '/learning-path' },
  { label: 'Questions & Answers', href: '/questions' },
  { label: 'Community Groups', href: '/community' },
  { label: 'Community Discussions', href: '/discussions' },
  { label: 'Scholars', href: '/scholars' },
]
const reviewLink = { label: 'Open Questions & Answers', href: '/questions' }

function reply(message: string, links: Link[] = [], details: string[] = []) {
  return NextResponse.json({ message, links, details }, { headers: { 'Cache-Control': 'no-store' } })
}

const prayerTimeQuestion = /^(?:(?:(?:what time|when) (?:is|are) (?:the )?|(?:show me|find) (?:the )?)?(fajr|dhuhr|zuhr|asr|maghrib|isha)(?: (?:prayer|time))?|(?:(?:what are|show me|find) (?:the )?)?prayer times)(?: today)?$/i
const namedPrayerTimeQuestion = /^what(?:['’]s| (?:is|are)) (?:the )?(fajr|dhuhr|zuhr|asr|maghrib|isha)(?: prayer)? times?(?: today)?$/i
const locationInQuestion = /\s+(?:in|near|for)\s+(.+)$/i

function readPrayerTimeQuestion(question: string) {
  const cleaned = question.trim().replace(/[?!.]+$/, '')
  const location = locationInQuestion.exec(cleaned)
  const subject = (location ? cleaned.slice(0, location.index) : cleaned).replace(/\s+/g, ' ')
  const prayer = prayerTimeQuestion.exec(subject) ?? namedPrayerTimeQuestion.exec(subject)
  if (!prayer || (!location && !/\s/.test(subject))) return null

  const place = location?.[1].replace(/\s+today$/i, '').trim()
  const name = prayer[1]?.toLowerCase().replace(/^zuhr$/, 'dhuhr')
  return { place, name }
}

async function answerQuestion(question: string) {
  const prayerTime = readPrayerTimeQuestion(question)
  if (prayerTime) {
    if (!prayerTime.place || prayerTime.place.length > 100) {
      return reply('Enter a city or postal code to look up local prayer times.', [
        { label: 'Open the masjid map and prayer times', href: '/masjids' },
      ])
    }
    return localResults(prayerTime.place, prayerTime.name)
  }

  const { items } = await getQuestionCatalog(getSupabaseAdmin())
  const sourced = items.filter(answer => answer.sources.length > 0)
  const normalized = normalizeQuestion(question)
  const exact = sourced.find(answer => [answer.question, ...answer.aliases].some(text => normalizeQuestion(text) === normalized))
  if (exact) return reply(exact.answer, exact.sources)

  const pageQuery = normalized
    .replace(/^(?:where (?:can|do) i find|how (?:can|do) i (?:open|find|access)|(?:please )?(?:open|show me|find|go to))\s+/, '')
    .replace(/^the\s+/, '')
    .replace(/\s+page$/, '')
  const page = pages.find(item => normalizeQuestion(item.label) === pageQuery)
  if (page) return reply(`Open ${page.label} to get started.`, [page])

  const { suggestions } = routeQuestion(question, sourced)
  const related = suggestions.find(answer => answer.strong)
  if (related) {
    return reply(`Related published answer — ${related.question} ${related.answer}`, [...related.sources, reviewLink])
  }

  return reply('I couldn’t find a published answer that matches. Browse Questions & Answers or request human review.', [
    reviewLink, { label: 'Search Connect to Masjid', href: '/search' },
  ])
}

async function localResults(location: string, prayer?: string) {
  const directory = { label: 'Open the masjid map and prayer times', href: `/masjids?q=${encodeURIComponent(location)}` }
  const point = await geocodeLocation(location)
  if (!point) return reply('I couldn’t identify that location. Try adding a province, state, country, or postal code.', [directory])
  const [nearby, prayers] = await Promise.allSettled([
    searchMasjidsNearby({ lat: point.lat, lng: point.lng }),
    getPrayerTimes(point.lat, point.lng),
  ])
  const links = nearby.status === 'fulfilled' ? nearby.value.masjids.slice(0, 3).map(masjid => ({
    label: masjid.name,
    href: `/masjids/${encodeURIComponent(masjid.id)}`,
  })) : []
  const allDetails = prayers.status === 'fulfilled' ? [
    `Fajr ${prayers.value.fajr}`, `Dhuhr ${prayers.value.dhuhr}`, `Asr ${prayers.value.asr}`,
    `Maghrib ${prayers.value.maghrib}`, `Isha ${prayers.value.isha}`,
  ] : []
  const details = prayer ? allDetails.filter(time => time.toLowerCase().startsWith(`${prayer} `)) : allDetails
  const timing = prayers.status === 'fulfilled'
    ? `Calculated prayer times for ${prayers.value.date ?? 'today'}. Check your masjid for iqamah and Jumu’ah times.`
    : 'Prayer times are temporarily unavailable.'
  const results = nearby.status === 'rejected' ? 'Masjid search is temporarily unavailable.' : links.length ? 'Nearby masjids are linked below.' : 'No nearby masjids were returned.'
  return reply(`${point.label}. ${timing} ${results}`, [...links, directory], details)
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: 'Open the assistant on Connect to Masjid.' }, { status: 403 })
  }

  try {
    const body = await request.text()
    if (body.length > 3000) return NextResponse.json({ message: 'Please shorten your request.' }, { status: 413 })
    const input = JSON.parse(body)
    const mode = input?.mode
    const text = typeof input?.text === 'string' ? input.text.trim() : ''
    if (!text || (mode !== 'local' && mode !== 'question') || text.length > (mode === 'local' ? 100 : 500)) {
      return NextResponse.json({ message: 'Enter a location or a short question.' }, { status: 400 })
    }
    return mode === 'local' ? await localResults(text) : await answerQuestion(text)
  } catch {
    return NextResponse.json({ message: 'The assistant is temporarily unavailable. Please try again.' }, { status: 503 })
  }
}
