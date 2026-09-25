import { describe, expect, it } from 'vitest'
import { AppError, toUserMessage } from '@/lib/errors'

describe('toUserMessage', () => {
  it('passes through a deliberate SQL RAISE EXCEPTION message (code P0001)', () => {
    expect(toUserMessage({ code: 'P0001', message: 'Insufficient leave balance for this month' })).toBe(
      'Insufficient leave balance for this month',
    )
  })

  it('never leaks a raw database error to the user', () => {
    const message = toUserMessage({ code: '42501', message: 'permission denied for table employees' })
    expect(message).not.toContain('table employees')
  })

  it('maps a duplicate key violation to a friendly message', () => {
    expect(toUserMessage({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe(
      'That record already exists.',
    )
  })

  it('maps invalid login credentials from Supabase Auth', () => {
    expect(toUserMessage({ message: 'Invalid login credentials' })).toBe('Invalid email or password.')
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(toUserMessage(new Error('ECONNRESET'))).toBe('Something went wrong. Please try again.')
  })

  it('returns an AppError message as-is', () => {
    expect(toUserMessage(new AppError('Could not create the employee.'))).toBe('Could not create the employee.')
  })
})
