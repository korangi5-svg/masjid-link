import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { knowledgeBase, parseTicket, publicAnswer, type KnowledgeAnswer } from '@/lib/questions'

export async function getQuestionCatalog(db:ReturnType<typeof getSupabaseAdmin>) {
  if(!db)return {items:knowledgeBase,available:false}
  const result=await db.from('contact_messages').select('id,message').eq('subject','QA:published').order('created_at',{ascending:false}).limit(200)
  const extra:KnowledgeAnswer[]=[]
  for(const row of result.data||[]) {const ticket=parseTicket(row.message);const answer=ticket&&publicAnswer(row.id,ticket);if(answer)extra.push(answer)}
  return {items:[...knowledgeBase,...extra],available:!result.error}
}
