import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ id: string }> }

const getArticle = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const result = await getSupabaseAdmin()?.from('scholar_articles')
    .select('title,body,summary,tags,categories,seo_title,seo_description,published_at')
    .eq('id', id).maybeSingle()
  return result?.data ?? null
})

export async function generateMetadata({ params }: Props) {
  const article = await getArticle((await params).id)
  if (!article) return {}
  return {
    title: article.seo_title,
    description: article.seo_description,
    openGraph: { type: 'article' as const, title: article.seo_title, description: article.seo_description, publishedTime: article.published_at },
  }
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).id)
  if (!article) notFound()
  return <article className="mx-auto max-w-3xl space-y-5 px-4 py-12">
    <p className="text-sm text-muted-foreground">{article.categories.join(' · ')}</p>
    <h1 className="text-4xl font-bold text-navy">{article.title}</h1>
    <p className="rounded-xl bg-surface p-4">{article.summary}</p>
    <div className="whitespace-pre-wrap break-words">{article.body}</div>
    <p className="text-sm text-muted-foreground">Tags · {article.tags.join(', ')}</p>
  </article>
}
