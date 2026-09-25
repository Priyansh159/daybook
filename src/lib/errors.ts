type ErrorLike = { message?: string; code?: string; status?: number; name?: string }

export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

// Raw database/network errors are never shown to users. Messages raised
// deliberately from our own SQL functions (code P0001) are already written
// for end users, so those pass through.
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.'

  const err = error as ErrorLike
  const message = err.message ?? ''

  if (err.code === 'P0001' && message) return message
  if (err.code === '23505') return 'That record already exists.'
  if (err.code === '42501' || err.status === 403) return 'You are not allowed to do that.'
  if (err.code === 'PGRST116') return 'The requested record was not found.'
  if (/invalid login credentials/i.test(message)) return 'Invalid email or password.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email before signing in.'
  if (/jwt expired|refresh token/i.test(message) || err.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }
  if (err.name === 'TypeError' && /fetch/i.test(message)) {
    return 'Network error. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
