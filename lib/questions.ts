export const questionCategories = ['Faith', 'Prayer', 'Purification', 'Quran', 'Dua', 'Learning', 'Community', 'General'] as const
export type QuestionCategory = typeof questionCategories[number]
export type KnowledgeAnswer = { id: string; question: string; answer: string; category: QuestionCategory; keywords: string[]; aliases: string[]; sources: { label: string; href: string }[] }
export const knowledgeBase: KnowledgeAnswer[] = [
  {id:'shahadah',question:'What does the Shahadah mean?',answer:'The Shahadah affirms Allah’s oneness and the messengership of Muhammad ﷺ. Begin by understanding both parts, and ask a trusted teacher for help with pronunciation and questions.',category:'Faith',keywords:['shahadah','testimony','faith','meaning'],aliases:['what is shahadah','what does shahadah mean','meaning of shahada','what does the declaration of faith mean','what is the declaration of faith in islam'],sources:[{label:'New Muslim Path · Shahadah',href:'/learning-path'},{label:'Quran 47:19',href:'https://quran.com/47/19'}]},
  {id:'prayers',question:'What are the five daily prayers?',answer:'Namaz, also called salah, is the prescribed ritual prayer in Islam. The five daily obligatory prayers are Fajr, Dhuhr, Asr, Maghrib, and Isha. Their times vary by location and season. Check a local masjid timetable for its actual congregational times.',category:'Prayer',keywords:['five','daily','prayer','names','fajr','dhuhr','asr','maghrib','isha'],aliases:['what are the five prayers','names of daily prayers','what is salah','what is salat','what is namaz','what does namaz mean','what does salah mean','what is islamic ritual prayer'],sources:[{label:'New Muslim Path · Salah',href:'/learning-path'},{label:'Sahih Muslim 16a',href:'https://sunnah.com/muslim:16a'}]},
  {id:'wudu',question:'What is wudu and how can I learn it?',answer:'Wudu is ritual purification with water before prayer. Quran 5:6 names the face, arms to the elbows, head, and feet to the ankles. Learn a complete demonstration with a trusted teacher; recognized traditions differ in details. For personal circumstances, ask a qualified teacher.',category:'Purification',keywords:['wudu','ablution','purification','wash','learn'],aliases:['what is wudu','how do i do wudu','how to perform ablution','how to make wudu'],sources:[{label:'New Muslim Path · Wudu',href:'/learning-path'},{label:'Quran 5:6',href:'https://quran.com/5/6'}]},
  {id:'quran-reference',question:'How do Quran references work?',answer:'A Quran reference identifies a surah (chapter) and ayah (verse). For example, 73:4 means surah 73, verse 4. Printed page numbers can vary by edition.',category:'Quran',keywords:['quran','reference','surah','ayah','chapter','verse','number'],aliases:['how do quran references work','what does surah mean','what is an ayah'],sources:[{label:'Quran Basics module',href:'/learning-path'},{label:'Quran 73:4',href:'https://quran.com/73/4'}]},
  {id:'dua-knowledge',question:'Is there a Quranic dua for seeking knowledge?',answer:'The closing prayer in Quran 20:114 is Rabbi zidni ilma: “My Lord! Increase me in knowledge.” This translation is by Dr. Mustafa Khattab, The Clear Quran. You can use this prayer while seeking knowledge. No fixed repetition count is prescribed here.',category:'Dua',keywords:['dua','supplication','knowledge','learn','study'],aliases:['dua for knowledge','dua before studying','prayer for learning'],sources:[{label:'Quran 20:114',href:'https://quran.com/20/114'},{label:'Daily learning',href:'/daily-learning'}]},
  {id:'path-unlock',question:'How do I unlock the next learning module?',answer:'Log in, read the current module, and pass its knowledge check. Completion is saved to your account and the next module unlocks automatically. The order is Shahadah, Salah, Wudu, then Quran Basics.',category:'Learning',keywords:['module','unlock','next','path','progress','complete','lesson'],aliases:['how do i unlock the next module','how do learning paths work','where is my saved progress'],sources:[{label:'Open your learning path',href:'/learning-path'}]},
  {id:'find-masjid',question:'How can I find a nearby masjid and its prayer times?',answer:'Open the masjid directory and search by city, address, or postal code. A masjid listing may show prayer times and links to the center’s own website. Confirm congregational and Jumu’ah times directly with the masjid, especially when a time is marked as an estimate.',category:'Community',keywords:['masjid','mosque','nearby','find','location','timetable','iqamah','jummah'],aliases:['find a masjid near me','where is my nearest mosque','how do i find prayer times'],sources:[{label:'Find masjids',href:'/masjids'}]},
]
const synonyms: Record<string,string> = {shahada:'shahadah',salah:'prayer',salat:'prayer',prayers:'prayer',namaz:'prayer',ablution:'wudu',wudhu:'wudu',wuzu:'wudu',koran:'quran',duas:'dua',supplication:'dua',modules:'module',mosques:'masjid',mosque:'masjid',lessons:'lesson',studying:'study'}
const stop = new Set('a an the is are do does did i my me we you your can how what where when to of in on for with and or please tell about it be have get'.split(' '))
export function normalizeQuestion(text: string) { return text.toLowerCase().normalize('NFKC').replace(/[’']/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim() }
function tokens(text:string) { return [...new Set(normalizeQuestion(text).split(' ').map(word=>synonyms[word]||word).filter(word=>word && !stop.has(word)))] }
export function classifyQuestion(question:string): QuestionCategory {
  const words = new Set(tokens(question))
  const groups: [QuestionCategory,string[]][] = [['Purification',['wudu','ghusl','tayammum','purity','bleeding']],['Faith',['shahadah','belief','faith','allah','convert']],['Quran',['quran','surah','ayah','recitation','tajwid']],['Dua',['dua','dhikr','adhkar','supplication']],['Learning',['module','path','unlock','progress','lesson']],['Prayer',['prayer','fajr','dhuhr','asr','maghrib','isha','qiblah']],['Community',['masjid','jummah','iqamah','community','event']]]
  return groups.find(([,keys])=>keys.some(key=>words.has(key)))?.[0] || 'General'
}
export function routeQuestion(question:string, catalog:KnowledgeAnswer[]=knowledgeBase) {
  const words=tokens(question), normalized=normalizeQuestion(question)
  const suggestions=catalog.map(item=>{
    const terms=new Set(tokens(`${item.question} ${item.keywords.join(' ')}`))
    const matched=words.filter(word=>terms.has(word)).length
    const exact=normalizeQuestion(item.question)===normalized || item.aliases.some(alias=>normalizeQuestion(alias)===normalized || tokens(alias).sort().join(' ') === [...words].sort().join(' '))
    const coverage=words.length ? matched/words.length : 0
    const strong=exact || (matched>=2 && coverage>=0.7)
    return {item,score:exact?2:coverage,matched,strong}
  }).filter(result=>result.matched>0).sort((a,b)=>Number(b.strong)-Number(a.strong)||b.score-a.score||b.matched-a.matched).slice(0,3)
  return {category:suggestions[0]?.strong?suggestions[0].item.category:classifyQuestion(question),needsReview:!suggestions.some(result=>result.strong),suggestions:suggestions.map(({item,strong})=>({...item,strong}))}
}
export type QuestionTicket = { question:string; category:QuestionCategory; ownerId:string; status:'pending'|'answered'; answer?:string; sources?:{label:string;href:string}[]; published?:boolean; answeredAt?:string }
export function parseTicket(message:unknown):QuestionTicket|null {
  try {const item=JSON.parse(String(message));if(typeof item.question!=='string'||typeof item.ownerId!=='string'||!questionCategories.includes(item.category)||!['pending','answered'].includes(item.status))return null;return item as QuestionTicket}catch{return null}
}
export function publicAnswer(id:string,ticket:QuestionTicket):KnowledgeAnswer|null {
  if(ticket.status!=='answered'||!ticket.published||!ticket.answer)return null
  return {id,question:ticket.question,answer:ticket.answer,category:ticket.category,keywords:[],aliases:[],sources:ticket.sources||[]}
}
export function isQuestionReviewer(user:{email?:string;email_confirmed_at?:string;app_metadata?:Record<string,unknown>}, allowlist:string) {
  return Boolean(user.email_confirmed_at && (user.app_metadata?.qa_reviewer===true || allowlist.split(',').map(email=>email.trim().toLowerCase()).filter(Boolean).includes(user.email?.toLowerCase()||'')))
}
