import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { POST as ask } from '../app/api/assistant/route'
import { POST as voice } from '../app/api/assistant/voice/route'
import { locales, unavailable, type Language } from '../lib/assistant-language'

const cases: { language: Language; text: string; answer: string }[] = [
  { language: 'en', text: 'What is wudu?', answer: 'Wudu is ritual purification' },
  { language: 'ur', text: 'وضو کیا ہے؟', answer: 'وضو نماز سے پہلے طہارت ہے۔' },
  { language: 'bn', text: 'ওজু কী?', answer: 'ওজু হলো নামাজের আগে পবিত্রতা অর্জন।' },
  { language: 'hi', text: 'वुज़ू क्या है?', answer: 'वुज़ू नमाज़ से पहले की जाने वाली पाकी है।' },
  { language: 'id', text: 'Apa itu wudu?', answer: 'Wudu adalah bersuci sebelum salat.' },
  { language: 'zh', text: '什么是小净？', answer: '小净是礼拜前的洁净仪式。' },
  { language: 'ar', text: 'ما هو الوضوء؟', answer: 'الوضوء طهارة قبل الصلاة.' },
]

const originalFetch = globalThis.fetch
const originalKey = process.env.OPENAI_API_KEY
const endpoint = 'https://masjid.test/api/assistant'
let fixture = cases[0]
let expectedPrevious: Language | undefined
let checkedSpeech: string | undefined
let providerFailure = false

function output(value: object) {
  return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] })
}

before(() => {
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = async (url, request) => {
    if (providerFailure) return new Response(null, { status: 503 })
    if (String(url).endsWith('/audio/transcriptions')) {
      const form = request?.body as FormData
      assert.equal(form.get('language'), null)
      assert.ok(form.get('file') instanceof File)
      return Response.json({ text: fixture.text })
    }
    const payload = JSON.parse(String(request?.body))
    if (String(url).endsWith('/audio/speech')) {
      checkedSpeech = payload.instructions
      assert.equal(payload.input, fixture.answer)
      return new Response('mock audio')
    }
    assert.equal(url, 'https://api.openai.com/v1/responses')
    assert.equal(payload.store, false)
    const input = JSON.parse(payload.input)
    if (input.query === undefined && input.mode) {
      assert.equal(input.text, fixture.text)
      if (expectedPrevious) {
        assert.equal(input.previous.language, expectedPrevious)
        assert.equal(input.previous.query, 'what is wudu')
      }
      return output({ language: fixture.language, query: 'what is wudu', unclear: false, greeting: false, greetingReply: '' })
    }
    assert.equal(input.language, fixture.language)
    assert.match(input.message, /Wudu is ritual purification/)
    return output({ message: fixture.answer, labels: input.labels.map(() => fixture.answer), details: [] })
  }
})

after(() => {
  globalThis.fetch = originalFetch
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = originalKey
})

function request(body: unknown) {
  return new Request(endpoint, { method: 'POST', body: JSON.stringify(body) })
}

for (const entry of cases) {
  test(`${entry.language}: text, transcription and speech contracts`, async () => {
    fixture = entry
    const transcription = await voice(new Request(`${endpoint}/voice`, {
      method: 'POST', headers: { 'Content-Type': 'audio/webm;codecs=opus', 'Content-Length': '4' }, body: 'mock',
    }))
    assert.equal(transcription.status, 200)
    assert.equal((await transcription.json()).text, entry.text)
    const response = await ask(request({ mode: 'question', text: entry.text }))
    assert.equal(response.status, 200)
    const answer = await response.json()
    assert.equal(answer.language, entry.language)
    assert.ok(answer.message.startsWith(entry.answer))
    assert.ok(answer.links.some((link: { href: string }) => link.href === 'https://quran.com/5/6'))
    const spoken = JSON.stringify({ text: entry.answer, language: entry.language })
    const audio = await voice(new Request(`${endpoint}/voice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(spoken)) }, body: spoken,
    }))
    assert.equal(audio.status, 200)
    assert.equal(audio.headers.get('Content-Type'), 'audio/mpeg')
    assert.match(checkedSpeech ?? '', new RegExp(`language ${entry.language}\\b`))
    assert.ok(locales[entry.language].startsWith(entry.language))
  })
}

for (const [language, text] of [
  ['ur', 'Please, mujhe bata dein ke wudu kaise karte hain?'],
  ['hi', 'Please, मुझे बताइए कि वुज़ू कैसे किया जाता है?'],
  ['bn', 'Please, আমাকে বলুন ওজু কীভাবে করতে হয়?'],
  ['ar', 'Please، هل يمكنك أن تشرح لي كيف أتوضأ؟'],
] as const) {
  test(`${language}: mixed input switches language while retaining context`, async () => {
    fixture = { ...cases.find(entry => entry.language === language)!, text }
    expectedPrevious = 'en'
    try {
      const response = await ask(request({ mode: 'question', text, previous: {
        mode: 'question', text: 'What is wudu?', query: 'what is wudu', language: 'en',
      } }))
      assert.equal(response.status, 200)
      assert.equal((await response.json()).language, language)
    } finally { expectedPrevious = undefined }
  })
}

test('provider failure returns a localized error and preserves the English lookup', async () => {
  providerFailure = true
  try {
    const nonEnglish = await ask(request({ mode: 'question', text: 'ওজু কী?' }))
    assert.equal(nonEnglish.status, 503)
    assert.equal((await nonEnglish.json()).message, unavailable.bn)
    const english = await ask(request({ mode: 'question', text: 'What is wudu?' }))
    assert.equal(english.status, 200)
    assert.match((await english.json()).message, /Wudu is ritual purification/)
  } finally { providerFailure = false }
})
