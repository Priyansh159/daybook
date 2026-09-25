import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

type Tab<T extends string> = { value: T; label: string; count?: number }

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadonlyArray<Tab<T>>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            tab.value === value
              ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function MonthPicker({
  label,
  onPrev,
  onNext,
  disableNext,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
  disableNext?: boolean
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onPrev}
        className="px-2.5 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={disableNext}
        className="px-2.5 py-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  )
}
