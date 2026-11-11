import Link from 'next/link'
import { articleLanguages } from '@/lib/scholar-translation'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string | string[] }> }

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

export default async function ArticlePage({ params, searchParams }: Props) {
  const { id } = await params
  const article = await getArticle(id)
  if (!article) notFound()
  const { lang } = await searchParams
  const translations = await getSupabaseAdmin()?.from('scholar_article_translations')
    .select('language,title,body,summary').eq('article_id', id)
  const available = articleLanguages.filter(language => translations?.data?.some(row => row.language === language.code))
  const language = available.find(option => option.code === lang)
  const translation = language && translations?.data?.find(row => row.language === language.code)
  const content = translation || article
  return <article className="mx-auto max-w-3xl space-y-5 px-4 py-12">
    <p className="text-sm text-muted-foreground">{article.categories.join(' · ')}</p>
    {available.length > 0 && <nav aria-label="Article language" className="flex flex-wrap gap-4 text-sm">
      <Link href={`/scholars/articles/${id}`} aria-current={!language ? 'page' : undefined} className="underline">Original</Link>
      {available.map(option => <Link key={option.code} lang={option.code} dir={option.direction}
        href={`/scholars/articles/${id}?lang=${option.code}`} aria-current={language?.code === option.code ? 'page' : undefined}
        className="underline">{option.label}</Link>)}
    </nav>}
    {translation && <p className="text-sm text-muted-foreground">AI translation · {language?.name}</p>}
    <div lang={language?.code} dir={language?.direction} className="space-y-5">
    <h1 className="text-4xl font-bold text-navy">{content.title}</h1>
    <p className="rounded-xl bg-surface p-4">{content.summary}</p>
    <div className="whitespace-pre-wrap break-words">{content.body}</div>
    </div>
    <p className="text-sm text-muted-foreground">Tags · {article.tags.join(', ')}</p>
  </article>
}
