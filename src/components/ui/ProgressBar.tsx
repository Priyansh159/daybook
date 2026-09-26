import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/utils/cn'

type Props = {
  value: number
  max: number
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, max, label, className, size = 'sm' }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const reduce = useReducedMotion()
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          <span className="font-medium tabular-nums">{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cn('w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', size === 'sm' ? 'h-1.5' : 'h-3')}
      >
        <motion.div
          className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-brand-500')}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', duration: 0.6, bounce: 0.15 }}
        />
      </div>
    </div>
  )
}
