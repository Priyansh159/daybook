import { useTheme } from '@/hooks/useTheme'
import GlideSelect, { type GlideSelectOption } from '@/components/micro/GlideSelect'

// Theme-aware wrapper around the vendored GlideSelect, matched to this app's
// light/dark palette instead of the component's own dark-first defaults.
export function ThemedSelect({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  options: (string | GlideSelectOption)[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}) {
  const { resolved } = useTheme()
  const colors =
    resolved === 'dark'
      ? { surfaceColor: '#0f172a', highlightColor: '#1e293b', textColor: '#e2e8f0', accentColor: '#818cf8' }
      : { surfaceColor: '#ffffff', highlightColor: '#f1f5f9', textColor: '#0f172a', accentColor: '#4f46e5' }

  return (
    <div className={className}>
      <GlideSelect
        options={options}
        value={value}
        onChange={(v) => onChange(v)}
        placeholder={placeholder}
        ariaLabel={ariaLabel ?? placeholder}
        size="sm"
        className={`w-full rounded-lg [&>button]:w-full [&>button]:justify-between border ${resolved === 'dark' ? 'border-slate-700' : 'border-slate-300'} shadow-sm`}
        {...colors}
      />
    </div>
  )
}
