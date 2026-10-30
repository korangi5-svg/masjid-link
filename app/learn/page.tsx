import type { Metadata } from 'next'
import { LearningLibrary } from '@/components/learning/learning-library'

export const metadata: Metadata = { title: 'Learning Library', description: 'Discover Islamic lectures, articles, courses, and podcasts.' }
export default function Page() { return <LearningLibrary /> }
