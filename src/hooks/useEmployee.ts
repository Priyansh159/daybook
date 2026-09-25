import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import type { EmployeeCreateValues, EmployeeUpdateValues, ProfileValues } from '@/lib/validation'
import type { EmployeeRow } from '@/types/database'
import {
  createEmployee,
  getEmployee,
  listEmployees,
  setEmployeeStatus,
  updateEmployee,
  updateMyProfile,
} from '@/services/employeeService'

export function useEmployees() {
  return useQuery({ queryKey: qk.employees, queryFn: listEmployees })
}

// id → employee lookup, shared by every admin list that shows names.
export function useEmployeeMap() {
  const query = useEmployees()
  const map = useMemo(() => new Map((query.data ?? []).map((e) => [e.id, e])), [query.data])
  return { ...query, map }
}

export function useEmployeeById(id: string | undefined) {
  return useQuery({ queryKey: qk.employee(id ?? ''), queryFn: () => getEmployee(id!), enabled: Boolean(id) })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: EmployeeCreateValues) => createEmployee(values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.employees })
      void qc.invalidateQueries({ queryKey: ['balances'] })
    },
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EmployeeUpdateValues }) => updateEmployee(id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.employees })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useSetEmployeeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmployeeRow['status'] }) => setEmployeeStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.employees })
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProfileValues }) => updateMyProfile(id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'profile'] })
      void qc.invalidateQueries({ queryKey: qk.employees })
    },
  })
}
