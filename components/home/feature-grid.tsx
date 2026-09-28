import { BookOpen, CalendarDays, Users } from 'lucide-react'
import { FeatureCard, type FeatureCardProps } from '@/components/home/feature-card'
import { MosqueIcon } from '@/components/icons/mosque-icon'

const features: FeatureCardProps[] = [
  {
    icon: MosqueIcon,
    title: 'Find Masjids',
    description: 'Locate mosques near you with ease.',
    href: '/masjids',
    color: 'bg-brand-blue',
  },
  {
    icon: CalendarDays,
    title: 'Upcoming Events',
    description: 'Stay informed about prayers, classes and community events.',
    href: '/events',
    color: 'bg-teal',
  },
  {
    icon: BookOpen,
    title: 'Islamic Resources',
    description: 'Access helpful guides, Quran, Hadith and more.',
    href: '/resources',
    color: 'bg-gold',
  },
  {
    icon: Users,
    title: 'Build Community',
    description: 'Connect with others and be part of something bigger.',
    href: '/signup',
    color: 'bg-purple',
  },
]

export function FeatureGrid() {
  return (
    <section aria-label="What you can do" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {features.map((f) => (
            <li key={f.title} className="sm:max-lg:[&:nth-child(n+3)]:border-t sm:max-lg:odd:border-r">
              <FeatureCard {...f} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
