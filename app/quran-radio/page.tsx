import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { focusRing } from '@/lib/site'

const stream = 'https://qurango.net/radio/alzain_mohammad_ahmad'

export const metadata: Metadata = {
  title: 'Quran Radio',
  description: 'Listen to a live stream of Quran recitation.',
}

export default function QuranRadioPage() {
  return (
    <>
      <PageHeader eyebrow="Listen" title="Quran Radio" description="Listen to live Quran recitation." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section aria-labelledby="station-name" className="rounded-2xl border border-[#E2BCEB] bg-[#FAF1FC] p-5 sm:p-8">
          <h2 id="station-name" className="text-xl font-semibold text-[#682575]">Alzain Mohammad Ahmad</h2>
          <audio aria-label="Live Quran recitation by Alzain Mohammad Ahmad" className="mt-4 w-full" controls preload="none" src={stream}>
            Your browser does not support the audio player.
          </audio>
          <p className="mt-4 text-sm text-[#682575]">
            Stream by <a className={`underline underline-offset-4 ${focusRing}`} href="https://mp3quran.org/eng/api">MP3Quran</a>
            {' · '}
            <a className={`underline underline-offset-4 ${focusRing}`} href={stream}>Open stream directly</a>
          </p>
        </section>
      </div>
    </>
  )
}
