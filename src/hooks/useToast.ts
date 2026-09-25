import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastAction = { label: string; onClick: () => void }

export type ToastOptions = { action?: ToastAction; duration?: number }

export type ToastApi = {
  show: (message: string, tone?: ToastTone, options?: ToastOptions) => void
  success: (message: string, options?: ToastOptions) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
