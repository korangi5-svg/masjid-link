import { Hero } from '@/components/home/hero'
import { FeatureGrid } from '@/components/home/feature-grid'
import { QuranQuote } from '@/components/home/quran-quote'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <QuranQuote />
    </>
  )
}
