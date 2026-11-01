import type { Metadata } from 'next'
import { LearningLibrary } from '@/components/learning/learning-library'
import { LearningPathLink } from '@/components/learning/learning-path'

export const metadata: Metadata = { title: 'Learning Library', description: 'Discover Islamic lectures, articles, courses, and podcasts.' }
export default function Page() { return <><div className="mx-auto max-w-6xl px-4"><LearningPathLink /></div><LearningLibrary /></> }
