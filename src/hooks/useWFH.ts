import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import type { LeaveType, RequestStatus } from '@/types/database'
import type { YearMonth } from '@/utils/date'
import { listWfhRecords, requestWfh } from '@/services/leaveService'
import { useInvalidateDayStatus } from '@/hooks/useLeave'

type Filter = { employeeId?: string; status?: RequestStatus; month?: YearMonth }

export function useWfhRecords(filter: Filter, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.wfhRecords(filter), queryFn: () => listWfhRecords(filter), enabled: options.enabled ?? true })
}

export function useRequestWfh() {
  const invalidate = useInvalidateDayStatus()
  return useMutation({
    mutationFn: ({ date, reason, portion }: { date: string; reason: string | null; portion?: LeaveType }) =>
      requestWfh(date, reason, portion),
    onSuccess: invalidate,
  })
}
