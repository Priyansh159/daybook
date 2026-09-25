import { cn } from '@/utils/cn'
import LatticeLoader from '@/components/micro/LatticeLoader'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-slate-400">
      <LatticeLoader label={label} status="working" color="currentColor" cellSize={8} gap={3} fontSize={13} />
    </div>
  )
}
