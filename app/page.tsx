import { Hero } from '@/components/home/hero'
import { FeatureGrid } from '@/components/home/feature-grid'
import { QuranQuote } from '@/components/home/quran-quote'
import { YourArea } from '@/components/home/your-area'

export default function HomePage() {
  return (
    <>
      <Hero />
      <YourArea />
      <FeatureGrid />
      <QuranQuote />
    </>
  )
}
