export const languages = ['en', 'ur', 'bn', 'hi', 'id', 'zh', 'ar'] as const
export type Language = typeof languages[number]
export const locales: Record<Language, string> = {
  en: 'en-CA', ur: 'ur-PK', bn: 'bn-BD', hi: 'hi-IN', id: 'id-ID', zh: 'zh-CN', ar: 'ar-SA',
}

export function isLanguage(value: unknown): value is Language {
  return languages.some(language => language === value)
}

const bengali = new RegExp('\\p{Script=Bengali}', 'u')
const devanagari = new RegExp('\\p{Script=Devanagari}', 'u')
const han = new RegExp('\\p{Script=Han}', 'u')
const arabic = new RegExp('\\p{Script=Arabic}', 'u')

export function scriptLanguage(text: string): Language | undefined {
  if (bengali.test(text)) return 'bn'
  if (devanagari.test(text)) return 'hi'
  if (han.test(text)) return 'zh'
  if (/[ٹڈڑںھہےگچپژ]/.test(text) && arabic.test(text)) return 'ur'
  if (arabic.test(text)) return 'ar'
}

export const unavailable: Record<Language, string> = {
  en: 'The assistant is temporarily unavailable. Please try again.',
  ur: 'معاون عارضی طور پر دستیاب نہیں ہے۔ دوبارہ کوشش کریں۔',
  bn: 'সহকারী সাময়িকভাবে অনুপলব্ধ। আবার চেষ্টা করুন।',
  hi: 'सहायक अस्थायी रूप से उपलब्ध नहीं है। कृपया फिर से कोशिश करें।',
  id: 'Asisten sementara tidak tersedia. Silakan coba lagi.',
  zh: '助手暂时无法使用，请重试。',
  ar: 'المساعد غير متاح مؤقتًا. يُرجى المحاولة مرة أخرى.',
}

export const clarifyLanguage: Record<Language, string> = {
  en: 'Could you add a few words so I can tell which language to use?',
  ur: 'براہِ کرم چند مزید الفاظ لکھیں تاکہ میں آپ کی زبان پہچان سکوں۔',
  bn: 'আপনার ভাষা চিনতে পারার জন্য আর কয়েকটি শব্দ লিখবেন?',
  hi: 'क्या आप कुछ और शब्द लिख सकते हैं ताकि मैं आपकी भाषा पहचान सकूँ?',
  id: 'Bisakah Anda menambahkan beberapa kata agar saya dapat mengenali bahasa Anda?',
  zh: '可以多写几个字吗？这样我就能识别你使用的语言。',
  ar: 'هل يمكنك إضافة بضع كلمات لكي أتمكن من تحديد لغتك؟',
}
