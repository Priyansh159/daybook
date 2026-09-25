import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import type { BalanceKind } from '@/types/database'
import type { YearMonth } from '@/utils/date'
import {
  adjustBalance,
  getOrInitBalance,
  listAdjustments,
  listBalancesForEmployee,
  listBalancesForMonth,
} from '@/services/balanceService'

export function useBalance(kind: BalanceKind, employeeId: string | undefined, ym: YearMonth) {
  return useQuery({
    queryKey: qk.balance(kind, employeeId ?? '', ym),
    queryFn: () => getOrInitBalance(kind, employeeId!, ym),
    enabled: Boolean(employeeId),
  })
}

export function useMonthBalances(kind: BalanceKind, ym: YearMonth) {
  return useQuery({ queryKey: qk.monthBalances(kind, ym), queryFn: () => listBalancesForMonth(kind, ym) })
}

export function useYearBalances(kind: BalanceKind, employeeId: string, year: number) {
  return useQuery({
    queryKey: qk.yearBalances(kind, employeeId, year),
    queryFn: () => listBalancesForEmployee(kind, employeeId, year),
  })
}

export function useAdjustments(filter: { kind?: BalanceKind; employeeId?: string }) {
  return useQuery({ queryKey: qk.adjustments(filter), queryFn: () => listAdjustments(filter) })
}

export function useAdjustBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adjustBalance,
    onSuccess: () => {
      for (const key of [['balance'], ['balances'], ['balances-year'], ['adjustments'], ['audit']]) {
        void qc.invalidateQueries({ queryKey: key })
      }
    },
  })
}
