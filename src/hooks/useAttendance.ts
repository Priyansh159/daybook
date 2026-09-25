import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listAttendance, setDailyStatus } from '@/services/attendanceService'
import { useInvalidateDayStatus } from '@/hooks/useLeave'

export function useAttendance(filter: { employeeId?: string; from: string; to: string }, options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.attendance(filter), queryFn: () => listAttendance(filter), enabled: options.enabled ?? true })
}

export function useSetDailyStatus() {
  const invalidate = useInvalidateDayStatus()
  return useMutation({ mutationFn: setDailyStatus, onSuccess: invalidate })
}
