import type { CommunityEvent } from '@/lib/types'

export const mockEvents: CommunityEvent[] = [
  {
    id: 'friday-khutbah',
    title: 'Friday Khutbah',
    category: 'Prayer',
    date: '2026-10-02',
    startTime: '1:15 PM',
    endTime: '2:00 PM',
    location: 'Islamic Foundation Mosque, Toronto',
    masjidId: 'islamic-foundation-mosque',
    description: 'Join the weekly Jumuah prayer and khutbah on gratitude and patience in daily life.',
    details:
      'This week’s khutbah reflects on shukr (gratitude) and sabr (patience) as the two wings of a believer. Please arrive early as the main hall fills quickly. Overflow space is available in the lower hall.',
  },
  {
    id: 'quran-study-circle',
    title: 'Quran Study Circle',
    category: 'Education',
    date: '2026-10-04',
    startTime: '7:00 PM',
    endTime: '8:30 PM',
    location: 'Masjid Al-Noor, Toronto',
    masjidId: 'masjid-al-noor',
    description: 'A weekly tafsir circle studying Surah Al-Kahf with reflections and open discussion.',
    details:
      'Our weekly circle continues its study of Surah Al-Kahf, looking at the lessons of the companions of the cave. All levels are welcome — bring a copy of the Quran with translation. Tea and refreshments are served.',
  },
  {
    id: 'youth-community-night',
    title: 'Youth Community Night',
    category: 'Youth',
    date: '2026-10-09',
    startTime: '6:30 PM',
    endTime: '9:00 PM',
    location: 'Markham Islamic Centre, Markham',
    masjidId: 'markham-islamic-centre',
    description: 'Games, a short reminder, and dinner for youth aged 13–19. A great way to meet new friends.',
    details:
      'An evening for teens to connect in a safe, fun environment. The night includes basketball, a short talk on friendship in Islam, and dinner after Maghrib. Parents are welcome to drop off and pick up.',
  },
  {
    id: 'family-islamic-workshop',
    title: 'Family Islamic Workshop',
    category: 'Family',
    date: '2026-10-11',
    startTime: '11:00 AM',
    endTime: '2:00 PM',
    location: 'Masjid Ar-Rahman, Mississauga',
    masjidId: 'masjid-ar-rahman',
    description: 'Interactive sessions for parents and children on building strong Muslim households.',
    details:
      'A hands-on workshop with parallel sessions for parents and kids. Parents will explore practical tools for nurturing faith at home, while children enjoy storytelling and crafts. Lunch is provided.',
  },
  {
    id: 'seerah-lecture-series',
    title: 'Seerah Lecture Series',
    category: 'Education',
    date: '2026-10-15',
    startTime: '7:30 PM',
    endTime: '9:00 PM',
    location: 'Masjid Al-Huda, Toronto',
    masjidId: 'masjid-al-huda',
    description: 'Continuing our study of the life of the Prophet ﷺ — this week: the migration to Madinah.',
    details:
      'This session covers the Hijrah and the founding of the first Muslim community in Madinah, with lessons for building community today. Q&A follows the lecture.',
  },
  {
    id: 'community-food-drive',
    title: 'Community Food Drive',
    category: 'Community',
    date: '2026-10-18',
    startTime: '10:00 AM',
    endTime: '3:00 PM',
    location: 'Masjid Darussalam, Toronto',
    masjidId: 'masjid-darussalam',
    description: 'Help sort and pack food hampers for families in need across the neighbourhood.',
    details:
      'Volunteers of all ages are needed to sort donations, pack hampers, and help with deliveries. Non-perishable food donations can be dropped off at the masjid all week.',
  },
]
