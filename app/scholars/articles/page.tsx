import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Scholar articles' }

export default async function ArticlesPage() {
  const db = getSupabaseAdmin()
  const result = await db?.from('scholar_articles').select('id,title,summary,published_at')
    .order('published_at', { ascending: false }).limit(100)

  return <main className="mx-auto max-w-4xl px-4 py-12">
    <h1 className="text-4xl font-bold text-navy">Scholar articles</h1>
    <p className="my-4"><Link href="/scholars/publish" className="underline">Publish an article</Link></p>
    {!result || result.error ? <p>Articles are temporarily unavailable.</p> : result.data.length ? <ul className="space-y-4">
      {result.data.map(article => <li key={article.id} className="rounded-xl border p-4">
        <Link href={`/scholars/articles/${article.id}`} className="text-lg font-semibold underline">{article.title}</Link>
        <p>{article.summary}</p>
      </li>)}
    </ul> : <p>No articles have been published yet.</p>}
  </main>
}
