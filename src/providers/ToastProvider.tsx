import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { ToastContext, type ToastAction, type ToastApi, type ToastOptions, type ToastTone } from '@/hooks/useToast'

type Toast = { id: number; message: string; tone: ToastTone; action?: ToastAction }

const toneClass: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/80 dark:text-emerald-300',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-300',
  info: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'info', options?: ToastOptions) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { id, message, tone, action: options?.action }])
      window.setTimeout(() => dismiss(id), options?.duration ?? 4000)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, options) => show(m, 'success', options),
      error: (m) => show(m, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
              toneClass[t.tone],
            )}
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
