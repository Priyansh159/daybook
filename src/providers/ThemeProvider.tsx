import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ResolvedTheme, type ThemePreference } from '@/hooks/useTheme'

const STORAGE_KEY = 'daybook-theme'

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Private browsing / blocked storage — fall back to system.
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore — the preference just won't survive a refresh.
    }
  }, [])

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
