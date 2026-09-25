import { useTheme } from '@/hooks/useTheme'

const ICONS = {
  light: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4l-1.4 1.4M6.6 17.4l-1.4 1.4m12.8 0l-1.4-1.4M6.6 6.6L5.2 5.2M12 17a5 5 0 100-10 5 5 0 000 10z',
  dark: 'M20.4 14.7A8.5 8.5 0 019.3 3.6a8.5 8.5 0 1011.1 11.1z',
  system: 'M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm4 15h8m-4-4v4',
} as const

const ORDER = ['light', 'dark', 'system'] as const
const LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'Match system theme' } as const

// One button that cycles light → dark → system, showing the *active* choice's icon.
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  const next = () => {
    const index = ORDER.indexOf(preference)
    setPreference(ORDER[(index + 1) % ORDER.length]!)
  }

  return (
    <button
      type="button"
      onClick={next}
      className={
        className ??
        'rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
      }
      aria-label={`Theme: ${LABEL[preference]}. Click to change.`}
      title={LABEL[preference]}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ICONS[preference]} />
      </svg>
    </button>
  )
}
