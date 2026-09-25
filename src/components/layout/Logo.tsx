import { useId } from 'react'
import { cn } from '@/utils/cn'

// The app's mark — a calendar with completed-day checkmarks (tasks/leave
// tracking), on the same blue→purple badge used elsewhere in the brand.
// Kept as one shared component so the sidebar, the login screen, and the
// favicon never drift out of sync.
export function Logo({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} role="img" aria-label="Daybook">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      {/* Binding pegs */}
      <rect x="16" y="8" width="3" height="8" rx="1.5" fill="#ffffff" />
      <rect x="29" y="8" width="3" height="8" rx="1.5" fill="#ffffff" />
      {/* Calendar body */}
      <rect x="10" y="13" width="28" height="25" rx="5" fill="#ffffff" />
      {/* Month header bar */}
      <rect x="13" y="17" width="22" height="4.5" rx="2.25" fill="#4338ca" />
      {/* Completed-day cells */}
      <rect x="13" y="25" width="9" height="9" rx="2.5" fill="#4f46e5" />
      <path d="M15.6 29.5 L17.4 31.3 L20.4 27.5" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="26" y="25" width="9" height="9" rx="2.5" fill="#4f46e5" />
      <path d="M28.6 29.5 L30.4 31.3 L33.4 27.5" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
