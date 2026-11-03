import type { Metadata } from 'next'
import { LearningLibrary } from '@/components/learning/learning-library'
import { LearningPathLink } from '@/components/learning/learning-path'
import { QuestionsLink } from '@/components/learning/questions'
import Link from 'next/link'
import { secondaryButton } from '@/lib/site'

export const metadata: Metadata = { title: 'Learning Library', description: 'Discover Islamic lectures, articles, courses, and podcasts.' }
export default function Page() { return <><div className="mx-auto max-w-6xl px-4"><LearningPathLink /><QuestionsLink /><section className="my-6 rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">Find your community</h2><p className="my-3">Discover groups with shared interests, languages, learning goals, and local connections.</p><Link href="/community" className={secondaryButton}>Find community groups</Link></section><section className="my-6 rounded-2xl border border-border p-6"><h2 className="text-2xl font-bold text-navy">Community discussions</h2><p className="my-3">Share ideas and learn together in a moderated community.</p><Link href="/discussions" className={secondaryButton}>Join the discussion</Link></section></div><LearningLibrary /></> }
