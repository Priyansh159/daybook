import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Tone } from '@/utils/formatters'
import { Skeleton } from '@/components/ui/Feedback'
import { RadialMeter } from '@/components/dashboard/RadialMeter'

const ACCENTS: Record<Tone, string> = {
  gray: 'text-slate-900 dark:text-slate-100',
  blue: 'text-blue-600 dark:text-blue-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'gray',
  loading,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: Tone
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className={cn('mt-1 text-2xl font-semibold tabular-nums', ACCENTS[accent])}>{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export type BalanceFigures = { allocated: number; used: number; remaining: number; adjustment?: number }

export function BalanceCard({
  title,
  balance,
  loading,
  format,
}: {
  title: string
  balance: BalanceFigures | undefined
  loading?: boolean
  format: (n: number) => string
}) {
  const allocatedTotal = balance ? balance.allocated + (balance.adjustment ?? 0) : 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      {loading || !balance ? (
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-[84px] w-[84px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-4">
            <RadialMeter
              value={balance.remaining}
              max={allocatedTotal}
              centerValue={format(balance.remaining)}
              centerLabel="remaining"
            />
            <dl className="flex-1 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Allocated</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{format(allocatedTotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Used</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{format(balance.used)}</dd>
              </div>
            </dl>
          </div>
          {balance.adjustment ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Includes admin adjustment of {balance.adjustment > 0 ? '+' : ''}
              {format(balance.adjustment)}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
