import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { sendPasswordReset } from '@/lib/auth'
import { toUserMessage } from '@/lib/errors'
import { forgotPasswordSchema } from '@/lib/validation'
import { AuthShell, authInputClassName } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input } from '@/components/ui/Form'

type Values = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  })

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one">
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            If an account exists for that email, a reset link is on its way. Check your inbox.
          </p>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={authInputClassName} {...register('email')} />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
          <p className="text-center">
            <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
