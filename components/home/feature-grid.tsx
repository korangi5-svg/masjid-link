import { BookOpen, CalendarDays, Clock, Users } from 'lucide-react'
import { FeatureCard, type FeatureCardProps } from '@/components/home/feature-card'
import { MosqueIcon } from '@/components/icons/mosque-icon'
import { accountsEnabled, eventsEnabled } from '@/lib/features'
import { cn } from '@/lib/utils'

const allFeatures: (FeatureCardProps & { enabled?: boolean })[] = [
  {
    icon: MosqueIcon,
    title: 'Find Masjids',
    description: 'Locate mosques near any address or your current location.',
    href: '/masjids',
    color: 'bg-brand-blue',
  },
  {
    icon: Clock,
    title: 'Prayer Times',
    description: 'See today’s prayer times and the next prayer wherever you are.',
    href: '/masjids',
    color: 'bg-navy',
    enabled: !eventsEnabled,
  },
  {
    icon: CalendarDays,
    title: 'Upcoming Events',
    description: 'Stay informed about prayers, classes and community events.',
    href: '/events',
    color: 'bg-teal',
    enabled: eventsEnabled,
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
    enabled: accountsEnabled,
  },
]

const features = allFeatures.filter((f) => f.enabled !== false)

export function FeatureGrid() {
  return (
    <section aria-label="What you can do" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul
          className={cn(
            'grid divide-y divide-border sm:divide-y-0 lg:divide-x',
            features.length === 3 ? 'sm:grid-cols-3 sm:divide-x' : 'sm:grid-cols-2 lg:grid-cols-4',
          )}
        >
          {features.map(({ enabled: _enabled, ...f }) => (
            <li key={f.title} className={cn(features.length !== 3 && 'sm:max-lg:[&:nth-child(n+3)]:border-t sm:max-lg:odd:border-r')}>
              <FeatureCard {...f} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
