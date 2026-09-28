import type { SVGProps } from 'react'

export function MosqueIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v2" />
      <path d="M7 12c0-3 2.2-5 5-6.5 2.8 1.5 5 3.5 5 6.5" />
      <path d="M6 21v-9h12v9" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      <path d="M2 21V10l1.5-2L5 10v11" />
      <path d="M19 21V10l1.5-2 1.5 2v11" />
      <path d="M1 21h22" />
    </svg>
  )
}
