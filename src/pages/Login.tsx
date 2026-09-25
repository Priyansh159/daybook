import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { signInWithPassword } from '@/lib/auth'
import { toUserMessage } from '@/lib/errors'
import { loginSchema } from '@/lib/validation'
import { AuthShell, authInputClassName } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Field, FormError, Input } from '@/components/ui/Form'

type LoginValues = z.infer<typeof loginSchema>

// On success, PublicOnlyRoute sees the new session + profile and redirects
// to the role's home page, so no navigate() is needed here.
export default function Login() {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null)
    try {
      await signInWithPassword(email, password)
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  })

  return (
    <AuthShell title="Sign in to Daybook" subtitle="Use the email and password from your administrator">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={authInputClassName} {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className={authInputClassName}
            {...register('password')}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
