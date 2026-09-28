import Link from 'next/link'
import { MosqueIcon } from '@/components/icons/mosque-icon'
import { primaryButton, secondaryButton } from '@/lib/site'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-teal">
        <MosqueIcon className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-navy">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        {"We couldn't find what you were looking for. It may have moved or no longer exists."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={primaryButton}>
          Go home
        </Link>
        <Link href="/masjids" className={secondaryButton}>
          Find a masjid
        </Link>
      </div>
    </div>
  )
}
