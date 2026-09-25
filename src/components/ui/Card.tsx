import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type CardProps = {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children?: ReactNode
}

export function Card({ title, description, actions, className, bodyClassName, children }: CardProps) {
  const hasHeader = title || description || actions
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
