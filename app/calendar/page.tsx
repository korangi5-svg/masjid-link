import type { Metadata } from 'next'
import { Calendar } from './calendar'

export const metadata: Metadata = {
  title: 'Hijri and Gregorian Calendar',
  description: 'View Hijri and Gregorian dates in your local time zone.',
}

export default function CalendarPage() {
  return <Calendar />
}
