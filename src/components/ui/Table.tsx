import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 dark:bg-slate-800/50">{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">{children}</tbody>
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300', className)} {...props} />
}
