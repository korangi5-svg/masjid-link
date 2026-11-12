import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { Assistant } from '@/components/assistant/assistant'

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'Find local masjids, check prayer times, and explore sourced Islamic answers.',
}

export default function AssistantPage() {
  return (
    <>
      <PageHeader eyebrow="Connect to Masjid" title="AI Assistant" description="Find a masjid, check local prayer times, or ask a question." />
      <Assistant />
    </>
  )
}
