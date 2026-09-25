import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const controlClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm ' +
  'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-100 aria-[invalid=true]:border-red-400 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ' +
  'dark:focus:ring-brand-500/30 dark:disabled:bg-slate-800 dark:aria-[invalid=true]:border-red-500 ' +
  'dark:[color-scheme:dark]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, 'h-10', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlClass, 'py-2', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, 'h-10 pr-8', className)} {...props}>
        {children}
      </select>
    )
  },
)

type FieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-red-500 dark:text-red-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300" role="alert">
      {message}
    </div>
  )
}
