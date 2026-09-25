import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import type { z } from 'zod'
import { updatePassword } from '@/lib/auth'
import { toUserMessage } from '@/lib/errors'
import { resetPasswordSchema } from '@/lib/validation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input } from '@/components/ui/Form'
import { FullPageSpinner } from '@/components/ui/Spinner'

type Values = z.infer<typeof resetPasswordSchema>

// Reached from the emailed recovery link; supabase-js turns the link's
// tokens into a session (detectSessionInUrl) before this form is usable.
export default function ResetPassword() {
  const { status, session } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(resetPasswordSchema) })

  if (status === 'loading') return <FullPageSpinner />

  if (!session) {
    return (
      <AuthShell title="Link expired" subtitle="This password reset link is invalid or has expired">
        <p className="text-center">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Request a new link
          </Link>
        </p>
      </AuthShell>
    )
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null)
    try {
      await updatePassword(password)
      toast.success('Password updated')
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  })

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirm)} {...register('confirm')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
