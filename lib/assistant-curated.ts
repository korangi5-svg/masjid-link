import { knowledgeBase } from './questions'
import { scriptLanguage, type Language } from './assistant-language'

type Locale = Exclude<Language, 'en'>
type Entry = [aliases: string[], message: string, learning: string, source: string]

const topics = {
  wudu: {
    ur: [['وضو کیا ہے','وضو کیسے کریں','wudu kya hai','wuzu kya hai'], 'وضو نماز سے پہلے پانی سے طہارت حاصل کرنے کا طریقہ ہے۔ قرآن ۵:۶ میں چہرے، کہنیوں تک بازوؤں، سر اور ٹخنوں تک پاؤں کا ذکر ہے۔ مکمل طریقہ کسی معتبر استاد سے سیکھیں۔', 'وضو سیکھیں', 'قرآن ۵:۶'],
    bn: [['ওজু কী','ওযু কি','অজু কী','কীভাবে ওজু করব','oju ki'], 'ওজু হলো নামাজের আগে পানি দিয়ে পবিত্রতা অর্জন। কুরআন ৫:৬-এ মুখ, কনুই পর্যন্ত হাত, মাথা এবং টাখনু পর্যন্ত পায়ের উল্লেখ আছে। সম্পূর্ণ পদ্ধতি একজন বিশ্বস্ত শিক্ষকের কাছে শিখুন।', 'ওজু শিখুন', 'কুরআন ৫:৬'],
    hi: [['वुज़ू क्या है','वुजू क्या है','वज़ू क्या है','वुज़ू कैसे करें','wuzu kaise kare'], 'वुज़ू नमाज़ से पहले पानी से पाकी हासिल करने का तरीका है। क़ुरआन ५:६ में चेहरे, कोहनियों तक बाज़ुओं, सिर और टखनों तक पैरों का ज़िक्र है। पूरा तरीका किसी भरोसेमंद शिक्षक से सीखें।', 'वुज़ू सीखें', 'क़ुरआन ५:६'],
    id: [['apa itu wudu','apa itu wudhu','bagaimana cara berwudu','cara wudhu'], 'Wudu adalah bersuci dengan air sebelum salat. Al-Qur’an 5:6 menyebut wajah, tangan hingga siku, kepala, dan kaki hingga mata kaki. Pelajari tata cara lengkapnya dari guru tepercaya.', 'Pelajari wudu', 'Al-Qur’an 5:6'],
    zh: [['什么是小净','什么是小淨','如何做小净','如何做小淨','小净是什么','小淨是什麼'], '小净是礼拜前用水进行的洁净仪式。《古兰经》5:6 提到脸、至肘的手臂、头部和至踝的双脚。请向可信赖的老师学习完整做法。', '学习小净', '《古兰经》5:6'],
    ar: [['ما هو الوضوء','ما الوضوء','كيف أتوضأ','كيفية الوضوء'], 'الوضوء طهارة بالماء قبل الصلاة. تذكر الآية ٥:٦ من القرآن الوجه واليدين إلى المرفقين والرأس والرجلين إلى الكعبين. تعلّم الطريقة كاملة من معلّم موثوق.', 'تعلّم الوضوء', 'القرآن ٥:٦'],
  },
  prayers: {
    ur: [['پانچ نمازیں کون سی ہیں','پانچ وقت کی نمازیں کون سی ہیں','نماز کیا ہے','namaz kya hai'], 'پانچ فرض نمازیں فجر، ظہر، عصر، مغرب اور عشاء ہیں۔ اوقات جگہ اور موسم کے مطابق بدلتے ہیں۔ باجماعت نماز کا وقت اپنی مسجد سے معلوم کریں۔', 'نماز کے بارے میں سیکھیں', 'صحیح مسلم ۱۶a'],
    bn: [['পাঁচ ওয়াক্ত নামাজ কী কী','পাঁচ ওয়াক্ত নামাজের নাম কী','নামাজ কী','namaz ki'], 'পাঁচ ওয়াক্ত ফরজ নামাজ হলো ফজর, যোহর, আসর, মাগরিব ও এশা। স্থান ও ঋতু অনুযায়ী সময় বদলায়। জামাতের সময় স্থানীয় মসজিদ থেকে জেনে নিন।', 'নামাজ সম্পর্কে শিখুন', 'সহিহ মুসলিম ১৬a'],
    hi: [['पाँच वक़्त की नमाज़ कौन सी हैं','पांच वक्त की नमाज कौन सी हैं','नमाज़ क्या है','namaz kya hoti hai'], 'पाँच फ़र्ज़ नमाज़ें फ़ज्र, ज़ुहर, अस्र, मग़रिब और इशा हैं। इनके वक़्त जगह और मौसम के हिसाब से बदलते हैं। जमाअत का वक़्त अपनी मस्जिद से पता करें।', 'नमाज़ के बारे में सीखें', 'सहीह मुस्लिम १६a'],
    id: [['apa saja salat lima waktu','apa saja shalat lima waktu','apa itu salat','apa itu shalat'], 'Lima salat wajib sehari adalah Subuh, Zuhur, Asar, Magrib, dan Isya. Waktunya berbeda menurut lokasi dan musim. Tanyakan jadwal berjemaah kepada masjid setempat.', 'Pelajari salat', 'Sahih Muslim 16a'],
    zh: [['五次礼拜是什么','五次禮拜是什麼','每日五次礼拜有哪些','每日五次禮拜有哪些','什么是礼拜'], '每日五次主命拜是晨礼、晌礼、晡礼、昏礼和宵礼。时间随地点和季节而变化，请向当地清真寺确认集体礼拜时间。', '学习礼拜', '《穆斯林圣训实录》16a'],
    ar: [['ما هي الصلوات الخمس','ما الصلوات الخمس','ما هي الصلاة','ما أسماء الصلوات الخمس'], 'الصلوات الخمس المفروضة هي الفجر والظهر والعصر والمغرب والعشاء. تختلف أوقاتها بحسب المكان والفصل. تحقّق من مواعيد صلاة الجماعة لدى مسجدك.', 'تعلّم الصلاة', 'صحيح مسلم ١٦a'],
  },
  shahadah: {
    ur: [['شہادت کا کیا مطلب ہے','کلمہ شہادت کیا ہے','شہادت کیا ہے','kalma shahadat kya hai'], 'کلمۂ شہادت اللہ کی وحدانیت اور محمد ﷺ کی رسالت کا اقرار ہے۔ دونوں حصوں کا مفہوم سمجھیں اور تلفظ سیکھنے کے لیے کسی معتبر استاد سے رجوع کریں۔', 'کلمۂ شہادت سیکھیں', 'قرآن ۴۷:۱۹'],
    bn: [['শাহাদাহ কী','শাহাদাহর অর্থ কী','শাহাদাত কী','কালেমা শাহাদাত কী'], 'শাহাদাহ হলো আল্লাহর একত্ব এবং মুহাম্মদ ﷺ যে তাঁর রাসুল, তার সাক্ষ্য। দুই অংশের অর্থ বুঝুন এবং উচ্চারণের জন্য একজন বিশ্বস্ত শিক্ষকের সাহায্য নিন।', 'শাহাদাহ সম্পর্কে শিখুন', 'কুরআন ৪৭:১৯'],
    hi: [['शहादा का क्या मतलब है','शहादा क्या है','शहादत का कलिमा क्या है'], 'शहादा अल्लाह की एकता और मुहम्मद ﷺ के अल्लाह के रसूल होने की गवाही है। दोनों हिस्सों का मतलब समझें और उच्चारण के लिए किसी भरोसेमंद शिक्षक की मदद लें।', 'शहादा के बारे में सीखें', 'क़ुरआन ४७:१९'],
    id: [['apa itu syahadat','apa arti syahadat','apa makna syahadat'], 'Syahadat adalah kesaksian atas keesaan Allah dan bahwa Muhammad ﷺ adalah utusan Allah. Pahami makna kedua bagiannya dan mintalah bantuan guru tepercaya untuk pelafalan.', 'Pelajari syahadat', 'Al-Qur’an 47:19'],
    zh: [['什么是清真言','清真言是什么意思','清真言是什麼意思','什麼是清真言'], '清真言是对真主独一以及穆罕默德 ﷺ 是真主使者的见证。请理解两部分的含义，并向可信赖的老师学习发音。', '学习清真言', '《古兰经》47:19'],
    ar: [['ما معنى الشهادة','ما معنى الشهادتين','ما هي الشهادتان','ما هي الشهادة'], 'الشهادتان إقرار بوحدانية الله وبأن محمدًا ﷺ رسول الله. ابدأ بفهم معنى الشهادتين واستعن بمعلّم موثوق لتعلّم النطق.', 'تعلّم الشهادتين', 'القرآن ٤٧:١٩'],
  },
} satisfies Record<string, Record<Locale, Entry>>

const marksAndPunctuation = new RegExp('[\\p{M}\\p{P}\\p{S}]+', 'gu')
function normalize(text: string) {
  return text.normalize('NFC').toLowerCase().replace(marksAndPunctuation, '').replace(/\s+/g, ' ').trim()
}

const index = new Map<string, { language: Locale; message: string; links: { label: string; href: string }[] }>()
for (const [id, entries] of Object.entries(topics)) {
  const published = knowledgeBase.find(answer => answer.id === id)
  if (!published || published.sources.length !== 2) continue
  for (const [language, [aliases, message, learning, source]] of Object.entries(entries)) {
    for (const alias of aliases) {
      index.set(normalize(alias), {
        language: language as Locale, message,
        links: [{ ...published.sources[0], label: learning }, { ...published.sources[1], label: source }],
      })
    }
  }
}

export function findCuratedAnswer(text: string) {
  return index.get(normalize(text))
}

const outOfScope: Record<Locale, string> = {
  ur: 'اس زبان میں دستیاب جواب تلاش کرنے کے لیے وضو، پانچ نمازوں یا کلمۂ شہادت کے بارے میں پوچھیں۔ مزید سوالات کے لیے سوال و جواب کا صفحہ دیکھیں۔',
  bn: 'এই ভাষায় ওজু, পাঁচ ওয়াক্ত নামাজ বা শাহাদাহ সম্পর্কে জিজ্ঞাসা করুন। অন্যান্য প্রশ্নের জন্য প্রশ্নোত্তর পাতা দেখুন।',
  hi: 'इस भाषा में वुज़ू, पाँच वक़्त की नमाज़ या शहादा के बारे में पूछें। अन्य सवालों के लिए प्रश्नोत्तर पेज देखें।',
  id: 'Dalam bahasa ini, tanyakan tentang wudu, salat lima waktu, atau syahadat. Untuk pertanyaan lain, buka halaman Tanya Jawab.',
  zh: '此语言目前可以查询小净、每日五次礼拜和清真言。其他问题请查看问答页面。',
  ar: 'يمكنك أن تسأل بهذه اللغة عن الوضوء أو الصلوات الخمس أو الشهادتين. للأسئلة الأخرى، راجع صفحة الأسئلة والأجوبة.',
}
const reviewLabels: Record<Locale, string> = { ur:'سوال و جواب', bn:'প্রশ্নোত্তর', hi:'प्रश्नोत्तर', id:'Tanya Jawab', zh:'问答', ar:'الأسئلة والأجوبة' }

export function curatedFallback(text: string) {
  const language = scriptLanguage(text) ?? (/\b(?:apa|bagaimana|tolong|salat|syahadat)\b/i.test(text) ? 'id' : undefined)
  if (!language || language === 'en') return
  return { language, message: outOfScope[language], links: [{ label: reviewLabels[language], href: '/questions' }] }
}
