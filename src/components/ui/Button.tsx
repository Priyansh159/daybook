import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'
import SpecularButton from '@/components/micro/SpecularButton'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

const variants: Record<Exclude<Variant, 'primary'>, string> = {
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-brand-500 ' +
    'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

// The primary variant keeps our compact sizing (not Specular's own lg/glassy
// presets) via !important overrides — inline style isn't forwarded by the
// vendored component, and plain classes lose the source-order tiebreak.
const specularSizes: Record<Size, string> = {
  sm: '!h-8 !px-3 !py-0 !text-xs !rounded-lg',
  md: '!h-10 !px-4 !py-0 !text-sm !rounded-lg',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  if (variant === 'primary') {
    return (
      <SpecularButton
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        tint="#4f46e5"
        tintOpacity={1}
        textColor="#ffffff"
        lineColor="#ffffff"
        baseColor="#3730a3"
        radius={8}
        proximity={180}
        className={cn(
          'gap-2 font-medium transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed dark:ring-offset-slate-900',
          specularSizes[size],
          className,
        )}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </SpecularButton>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:ring-offset-slate-900',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        'active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
