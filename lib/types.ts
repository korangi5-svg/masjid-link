export interface PrayerTimes {
  fajr: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  jumuah: string
}

export interface Masjid {
  id: string
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  distanceKm: number
  phone: string
  website?: string
  description: string
  services: string[]
  prayerTimes: PrayerTimes
}

export type EventCategory = 'Prayer' | 'Education' | 'Youth' | 'Family' | 'Community'

export interface CommunityEvent {
  id: string
  title: string
  category: EventCategory
  date: string
  startTime: string
  endTime: string
  location: string
  masjidId: string
  description: string
  details: string
}

export type ResourceCategoryId = 'quran' | 'hadith' | 'dua' | 'articles' | 'education'

export interface ResourceLink {
  title: string
  description: string
  href: string
}

export interface ResourceCategory {
  id: ResourceCategoryId
  title: string
  description: string
  links: ResourceLink[]
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}

export interface ServiceResult<T = undefined> {
  ok: boolean
  data?: T
  error?: string
}
