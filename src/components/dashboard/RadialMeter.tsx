import { cn } from '@/utils/cn'

type Severity = 'healthy' | 'warning' | 'critical'

// Meter spec: fill carries severity, the unfilled track is a lighter step of
// the same hue (never a flat neutral gray) so the state reads at a glance.
const RING: Record<Severity, { fill: string; track: string }> = {
  healthy: { fill: 'stroke-brand-600 dark:stroke-brand-400', track: 'stroke-brand-100 dark:stroke-brand-900/40' },
  warning: { fill: 'stroke-amber-500 dark:stroke-amber-400', track: 'stroke-amber-100 dark:stroke-amber-900/40' },
  critical: { fill: 'stroke-red-500 dark:stroke-red-400', track: 'stroke-red-100 dark:stroke-red-900/40' },
}

function severityOf(value: number, max: number): Severity {
  if (value <= 0) return 'critical'
  if (max > 0 && value / max <= 0.25) return 'warning'
  return 'healthy'
}

export function RadialMeter({
  value,
  max,
  size = 84,
  strokeWidth = 8,
  centerValue,
  centerLabel,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  centerValue: string
  centerLabel: string
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const severity = severityOf(value, max)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * pct

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className={RING[severity].track} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={cn(RING[severity].fill, 'transition-[stroke-dasharray] duration-500 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{centerValue}</span>
        <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">{centerLabel}</span>
      </div>
    </div>
  )
}
