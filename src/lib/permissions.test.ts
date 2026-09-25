import { describe, expect, it } from 'vitest'
import { canUseApp, homePathFor, isAdmin } from '@/lib/permissions'

describe('homePathFor', () => {
  it('sends admins to the admin dashboard and employees to the employee dashboard', () => {
    expect(homePathFor('ADMIN')).toBe('/admin/dashboard')
    expect(homePathFor('EMPLOYEE')).toBe('/dashboard')
  })
})

describe('canUseApp', () => {
  it('blocks only INACTIVE employees (§50) — ACTIVE and ON_NOTICE keep access', () => {
    expect(canUseApp({ status: 'ACTIVE' })).toBe(true)
    expect(canUseApp({ status: 'ON_NOTICE' })).toBe(true)
    expect(canUseApp({ status: 'INACTIVE' })).toBe(false)
  })
})

describe('isAdmin', () => {
  it('is false for a missing employee (e.g. before the profile loads)', () => {
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })

  it('checks the role field', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true)
    expect(isAdmin({ role: 'EMPLOYEE' })).toBe(false)
  })
})
