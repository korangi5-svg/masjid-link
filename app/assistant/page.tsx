import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { Assistant } from '@/components/assistant/assistant'

export const metadata: Metadata = {
  title: 'Site Assistant',
  description: 'Find local masjids, check prayer times, and explore sourced Islamic answers.',
}

export default function AssistantPage() {
  return (
    <>
      <PageHeader eyebrow="Connect to Masjid" title="Site Assistant" description="Find a masjid, check local prayer times, or ask a question." />
      <Assistant paidVoice={process.env.ASSISTANT_PAID_SERVICES === 'true' && Boolean(process.env.OPENAI_API_KEY)} />
    </>
  )
}
