import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findCuratedAnswer } from '../lib/assistant-curated'

const samples = [
  ['ur', 'وضو کیا ہے', 'پانچ نمازیں کون سی ہیں', 'شہادت کیا ہے'],
  ['bn', 'ওজু কী', 'পাঁচ ওয়াক্ত নামাজ কী কী', 'শাহাদাহ কী'],
  ['hi', 'वुज़ू क्या है', 'पाँच वक़्त की नमाज़ कौन सी हैं', 'शहादा क्या है'],
  ['id', 'Apa itu wudu', 'Apa saja salat lima waktu', 'Apa itu syahadat'],
  ['zh', '什么是小净', '每日五次礼拜有哪些', '什么是清真言'],
  ['ar', 'ما هو الوضوء', 'ما هي الصلوات الخمس', 'ما معنى الشهادة'],
]
for (const [language, ...questions] of samples) {
  test(`Published multilingual answers in ${language}`, () => {
    const urls = ['https://quran.com/5/6', 'https://sunnah.com/muslim:16a', 'https://quran.com/47/19']
    questions.forEach((question, index) => {
      const answer = findCuratedAnswer(question + '؟')
      assert.equal(answer?.language, language)
      assert.equal(answer?.links[1]?.href, urls[index])
    })
  })
}
