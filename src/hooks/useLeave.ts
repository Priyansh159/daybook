import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DAY_STATUS_DEPENDENTS, qk } from '@/lib/queryKeys'
import type { LeaveType, RequestStatus } from '@/types/database'
import type { YearMonth } from '@/utils/date'
import { listLeaveRequests, requestLeave, reviewLeaveRequest, withdrawDay } from '@/services/leaveService'

type Filter = { employeeId?: string; status?: RequestStatus; month?: YearMonth }

export function useLeaveRequests(filter: Filter, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.leaveRequests(filter), queryFn: () => listLeaveRequests(filter), enabled: options.enabled ?? true })
}

export function useInvalidateDayStatus() {
  const qc = useQueryClient()
  return () => {
    for (const key of DAY_STATUS_DEPENDENTS) void qc.invalidateQueries({ queryKey: key })
  }
}

export function useRequestLeave() {
  const invalidate = useInvalidateDayStatus()
  return useMutation({
    mutationFn: ({ date, leaveType, reason }: { date: string; leaveType: LeaveType; reason: string | null }) =>
      requestLeave(date, leaveType, reason),
    onSuccess: invalidate,
  })
}

export function useWithdrawDay() {
  const invalidate = useInvalidateDayStatus()
  return useMutation({ mutationFn: (date: string) => withdrawDay(date), onSuccess: invalidate })
}

export function useReviewLeave() {
  const qc = useQueryClient()
  const invalidate = useInvalidateDayStatus()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<RequestStatus, 'PENDING'> }) => reviewLeaveRequest(id, status),
    onSuccess: () => {
      invalidate()
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}
