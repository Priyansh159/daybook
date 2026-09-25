import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import {
  addHoliday,
  deleteHoliday,
  getSettings,
  listAuditLogs,
  listHolidays,
  updateSettings,
} from '@/services/settingsService'

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: getSettings, staleTime: 5 * 60_000 })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: updateSettings, onSuccess: (data) => qc.setQueryData(qk.settings, data) })
}

export function useHolidays(range?: { from: string; to: string }) {
  return useQuery({ queryKey: qk.holidays(range), queryFn: () => listHolidays(range), staleTime: 5 * 60_000 })
}

export function useAddHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ date, name }: { date: string; name: string }) => addHoliday(date, name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useDeleteHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useAuditLogs(filter: { entityId?: string; limit?: number } = {}) {
  return useQuery({ queryKey: qk.audit(filter), queryFn: () => listAuditLogs(filter) })
}
