import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { getResourceCategories } from '@/lib/services/resources'
import { ResourceLibrary } from './resource-library'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Islamic Resources',
  description: 'Helpful guides to the Quran, Hadith, Dua, Islamic articles, and educational resources.',
}

export default async function ResourcesPage() {
  const categories = await getResourceCategories()

  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Islamic resources"
        description="Trusted places to read, listen, and learn — for new Muslims, families, and lifelong students of knowledge."
      />
      <ResourceLibrary categories={categories} />
    </>
  )
}
