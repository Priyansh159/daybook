import type { ReactNode } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Logo } from '@/components/layout/Logo'
import Silk from '@/components/backgrounds/Silk'
import GlassSurface from '@/components/micro/GlassSurface'

// Auth screens always use this dark glass look, independent of the app's own
// light/dark preference (there's no toggle here) — so form fields need their
// own override rather than the shared Input's light/dark classes.
export const authInputClassName =
  '!border-white/15 !bg-white/10 !text-white !shadow-none placeholder:!text-white/45 ' +
  'focus:!border-white/40 focus:!ring-white/25 [color-scheme:dark]'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    // Forces every `dark:` class in this subtree on, regardless of the app's
    // actual theme preference — this screen is always the dark glass look.
    <div className="dark">
      <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
        {!reducedMotion && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Silk speed={2.5} scale={1} color="#4f46e5" noiseIntensity={1.2} rotation={0} lightMode={false} />
          </div>
        )}

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
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={16}
            backgroundOpacity={0.14}
            distortionScale={-140}
            greenOffset={6}
            blueOffset={12}
            forceTheme="dark"
            className="shadow-lg"
          >
            <div className="w-full p-6">{children}</div>
          </GlassSurface>
        </div>
      </div>
    </div>
  )
}
