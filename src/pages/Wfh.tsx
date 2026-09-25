import { useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useAdjustBalance, useBalance } from '@/hooks/useBalances'
import { useWithdrawDay } from '@/hooks/useLeave'
import { useRequestWfh, useWfhRecords } from '@/hooks/useWFH'
import { currentYearMonth, formatShortDate, monthLabel, shiftMonth } from '@/utils/date'
import { formatDays, REQUEST_STATUS_META } from '@/utils/formatters'
import { toUserMessage } from '@/lib/errors'
import type { AdjustmentValues, WfhRequestValues } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { WfhRequestDialog } from '@/components/wfh/WfhRequestDialog'
import { AdjustBalanceDialog } from '@/components/employees/AdjustBalanceDialog'
import { BalanceCard } from '@/components/dashboard/StatCard'
import { MonthPicker, PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function Wfh() {
  const employee = useCurrentEmployee()
  const toast = useToast()
  const [month, setMonth] = useState(currentYearMonth())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)

  const ym = currentYearMonth()
  const balance = useBalance('WFH', employee.id, ym)
  const records = useWfhRecords({ employeeId: employee.id, month })
  const requestWfh = useRequestWfh()
  const withdraw = useWithdrawDay()
  const adjustBalance = useAdjustBalance()

  const submit = async (values: WfhRequestValues) => {
    setFormError(null)
    try {
      await requestWfh.mutateAsync({ date: values.date, reason: values.reason })
      toast.success('WFH recorded')
      setDialogOpen(false)
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  }

  const submitAdjust = async (values: AdjustmentValues) => {
    setAdjustError(null)
    try {
      await adjustBalance.mutateAsync({ kind: 'WFH', employeeId: employee.id, ym, amount: values.amount, reason: values.reason })
      toast.success('WFH balance updated')
      setAdjustOpen(false)
    } catch (err) {
      setAdjustError(toUserMessage(err))
    }
  }

  const confirmCancel = async () => {
    if (!cancelling) return
    try {
      await withdraw.mutateAsync(cancelling)
      toast.success('WFH cancelled')
      setCancelling(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const active = (records.data ?? []).filter((r) => r.status !== 'CANCELLED')

  return (
    <div>
      <PageHeader title="Work From Home" description="Your WFH days" actions={<Button onClick={() => setDialogOpen(true)}>+ Request WFH</Button>} />

      <div className="mb-6 max-w-sm space-y-2">
        <BalanceCard title={`This month · ${monthLabel(ym)}`} balance={balance.data} loading={balance.isPending} format={formatDays} />
        <Button size="sm" variant="secondary" onClick={() => setAdjustOpen(true)}>
          Adjust balance
        </Button>
      </div>

      <Card
        title="History"
        actions={<MonthPicker label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />}
        bodyClassName="p-0"
      >
        {records.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : records.error ? (
          <div className="p-5">
            <ErrorState error={records.error} onRetry={() => void records.refetch()} />
          </div>
        ) : active.length === 0 ? (
          <EmptyState title="No WFH days recorded." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Duration</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </THead>
            <TBody>
              {active.map((r) => (
                <tr key={r.id}>
                  <Td>{formatShortDate(r.date)}</Td>
                  <Td>{formatDays(r.duration)}</Td>
                  <Td className="max-w-xs truncate">{r.reason || '—'}</Td>
                  <Td>
                    <Badge tone={REQUEST_STATUS_META[r.status].tone}>{REQUEST_STATUS_META[r.status].label}</Badge>
                  </Td>
                  <Td>
                    {r.status === 'APPROVED' && (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50" onClick={() => setCancelling(r.date)}>
                        Cancel
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <WfhRequestDialog open={dialogOpen} error={formError} onClose={() => setDialogOpen(false)} onSubmit={submit} />
      <AdjustBalanceDialog open={adjustOpen} kind="WFH" ym={ym} error={adjustError} onClose={() => setAdjustOpen(false)} onSubmit={submitAdjust} />
      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this WFH day?"
        message="This day will be marked back as Working and your WFH balance will be restored."
        confirmLabel="Cancel WFH"
        loading={withdraw.isPending}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelling(null)}
      />
    </div>
  )
}
