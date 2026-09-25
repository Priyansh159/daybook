import { useId } from 'react'
import { cn } from '@/utils/cn'

// The app's mark — a bold spider badge (rounded square, gradient fill),
// matching the /favicon.svg. Kept as one shared component so the sidebar,
// the login screen, and the favicon never drift out of sync.
export function Logo({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} role="img" aria-label="Daybook">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <g fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M29 20 L36 12 L42 8" />
        <path d="M30 23 L38 17 L44 15" />
        <path d="M30 27 L38 31 L44 33" />
        <path d="M29 30 L36 36 L42 40" />
        <path d="M19 20 L12 12 L6 8" />
        <path d="M18 23 L10 17 L4 15" />
        <path d="M18 27 L10 31 L4 33" />
        <path d="M19 30 L12 36 L6 40" />
      </g>
      <ellipse cx="24" cy="26.5" rx="6.2" ry="5.6" fill="#ffffff" />
      <circle cx="24" cy="17.5" r="4.2" fill="#ffffff" />
      <circle cx="22" cy="17" r="1.1" fill="#4338ca" />
      <circle cx="26" cy="17" r="1.1" fill="#4338ca" />
    </svg>
  )
}
