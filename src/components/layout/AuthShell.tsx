import type { ReactNode } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { PrismaticBurst } from '@/components/backgrounds/PrismaticBurst'

// The brand ramp, fed into the shader's gradient as hex stops.
const BURST_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#4338ca']

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { resolved } = useTheme()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <PrismaticBurst
            animationType="rotate3d"
            intensity={resolved === 'dark' ? 1.6 : 1.1}
            speed={0.35}
            distort={1.4}
            rayCount={10}
            colors={BURST_COLORS}
            mixBlendMode={resolved === 'dark' ? 'lighten' : 'multiply'}
            lightMode={resolved === 'light'}
          />
        </div>
      )}

      <ThemeToggle className="absolute right-4 top-4 z-10 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="mb-3 h-11 w-11 rounded-xl shadow-lg shadow-brand-600/30" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
            Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and set your project URL and anon key.
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          {children}
        </div>
      </div>
    </div>
  )
}
