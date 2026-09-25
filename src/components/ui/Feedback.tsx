import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { toUserMessage } from '@/lib/errors'
import { Button } from '@/components/ui/Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50', className)} aria-hidden="true" />
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

type EmptyStateProps = { title: string; description?: string; action?: ReactNode; className?: string }

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4l-2 2h-4l-2-2H4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center" role="alert">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">Couldn't load this data</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toUserMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
