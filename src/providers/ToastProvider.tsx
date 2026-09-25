import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastAction, type ToastApi, type ToastOptions, type ToastTone } from '@/hooks/useToast'
import SwipeToast from '@/components/micro/SwipeToast'

type Toast = { id: number; message: string; tone: ToastTone; action?: ToastAction; duration: number }

const TONE_FUSE: Record<ToastTone, string> = {
  success: '#22c55e',
  error: '#f87171',
  info: '#818cf8',
}

const TONE_ICON: Record<ToastTone, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, tone: ToastTone = 'info', options?: ToastOptions) => {
    const id = nextId.current++
    setToasts((list) => [...list.slice(-3), { id, message, tone, action: options?.action, duration: options?.duration ?? 4000 }])
  }, [])

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
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center px-4 sm:inset-x-auto sm:right-4 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <SwipeToast
            key={t.id}
            inline
            className="pointer-events-auto"
            title={t.message}
            icon={TONE_ICON[t.tone]}
            actionLabel={t.action?.label}
            onAction={t.action?.onClick}
            duration={t.duration}
            background="#1e293b"
            color="#f1f5f9"
            fuseColor={TONE_FUSE[t.tone]}
            width={356}
            radius={12}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
