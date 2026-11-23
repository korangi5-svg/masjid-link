import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/page-header'
import { focusRing } from '@/lib/site'

const stream = 'https://qurango.net/radio/alzain_mohammad_ahmad'

const radioLinks = [
  {
    name: 'Quran.com Radio',
    href: 'https://quran.com/radio',
    description: 'Curated Quran recitations and stations by reciter.',
  },
  {
    name: 'Quran Radio',
    href: 'https://quranradio.cc/eng/',
    description: 'Live Quran channel from Makkah and continuous reciter stations.',
  },
  {
    name: 'MP3Quran Live Radio',
    href: 'https://www.mp3quran.net/eng/radios',
    description: 'Live reciter stations, including streams with English and Urdu translations.',
  },
  {
    name: 'Cairo Quran FM 98.2',
    href: 'https://radio.garden/listen/quran-fm-98-2-idhaet-alqran-alkrym/GQxvGBNK',
    description: 'Listen to Cairo’s Quran radio station live on Radio Garden.',
  },
]

export const metadata: Metadata = {
  title: 'Quran Radio',
  description: 'Listen to live Quran recitation and explore more Quran radio stations.',
}

export default function QuranRadioPage() {
  return (
    <>
      <PageHeader eyebrow="Listen" title="Quran Radio" description="Listen to live Quran recitation." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section aria-labelledby="station-name" className="rounded-2xl border-4 border-navy bg-[#FAF1FC] p-5 sm:p-8">
          <h2 id="station-name" className="text-xl font-semibold text-[#682575]">Alzain Mohammad Ahmad</h2>
          <audio aria-label="Live Quran recitation by Alzain Mohammad Ahmad" className="mt-4 block h-16 w-full rounded-full border-4 border-navy" controls preload="none" src={stream}>
            Your browser does not support the audio player.
          </audio>
          <p className="mt-4 text-sm text-[#682575]">
            Stream by <a className={`underline underline-offset-4 ${focusRing}`} href="https://mp3quran.org/eng/api">MP3Quran</a>
            {' · '}
            <a className={`underline underline-offset-4 ${focusRing}`} href={stream}>Open stream directly</a>
          </p>
        </section>

        <section aria-labelledby="more-stations" className="mt-8 rounded-2xl border-4 border-navy p-5 sm:p-8">
          <h2 id="more-stations" className="text-xl font-semibold text-[#682575]">More Quran radio stations</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {radioLinks.map(({ name, href, description }) => (
              <li key={href} className="rounded-2xl border-4 border-navy bg-[#FAF1FC]">
                <a className={`block h-full rounded-2xl p-4 text-[#682575] ${focusRing}`} href={href}>
                  <span className="font-semibold underline underline-offset-4">{name}</span>
                  <span className="mt-1 block text-sm">{description}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
