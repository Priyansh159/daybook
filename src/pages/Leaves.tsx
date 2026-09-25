import { useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useAuth'
import { useAdjustBalance, useBalance } from '@/hooks/useBalances'
import { useLeaveRequests, useRequestLeave, useWithdrawDay } from '@/hooks/useLeave'
import { currentYearMonth, formatShortDate, monthLabel, shiftMonth } from '@/utils/date'
import { formatDays, LEAVE_TYPE_LABEL, REQUEST_STATUS_META } from '@/utils/formatters'
import { toUserMessage } from '@/lib/errors'
import type { AdjustmentValues, LeaveRequestValues } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { LeaveRequestDialog } from '@/components/leaves/LeaveRequestDialog'
import { AdjustBalanceDialog } from '@/components/employees/AdjustBalanceDialog'
import { BalanceCard } from '@/components/dashboard/StatCard'
import { MonthPicker, PageHeader } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

export default function Leaves() {
  const employee = useCurrentEmployee()
  const toast = useToast()
  const [month, setMonth] = useState(currentYearMonth())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)

  const ym = currentYearMonth()
  const balance = useBalance('LEAVE', employee.id, ym)
  const requests = useLeaveRequests({ employeeId: employee.id, month })
  const requestLeave = useRequestLeave()
  const withdraw = useWithdrawDay()
  const adjustBalance = useAdjustBalance()

  const submit = async (values: LeaveRequestValues) => {
    setFormError(null)
    try {
      await requestLeave.mutateAsync({ date: values.date, leaveType: values.leaveType, reason: values.reason })
      toast.success('Leave recorded')
      setDialogOpen(false)
    } catch (err) {
      setFormError(toUserMessage(err))
    }
  }

  const submitAdjust = async (values: AdjustmentValues) => {
    setAdjustError(null)
    try {
      await adjustBalance.mutateAsync({ kind: 'LEAVE', employeeId: employee.id, ym, amount: values.amount, reason: values.reason })
      toast.success('Leave balance updated')
      setAdjustOpen(false)
    } catch (err) {
      setAdjustError(toUserMessage(err))
    }
  }

  const confirmCancel = async () => {
    if (!cancelling) return
    try {
      await withdraw.mutateAsync(cancelling)
      toast.success('Leave cancelled')
      setCancelling(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const active = (requests.data ?? []).filter((r) => r.status !== 'CANCELLED')

  return (
    <div>
      <PageHeader title="Leaves" description="Full day and half day leave" actions={<Button onClick={() => setDialogOpen(true)}>+ Request Leave</Button>} />

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
        {requests.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : requests.error ? (
          <div className="p-5">
            <ErrorState error={requests.error} onRetry={() => void requests.refetch()} />
          </div>
        ) : active.length === 0 ? (
          <EmptyState title="No leave requests found." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
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
                  <Td>{LEAVE_TYPE_LABEL[r.leave_type]}</Td>
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

      <LeaveRequestDialog open={dialogOpen} error={formError} onClose={() => setDialogOpen(false)} onSubmit={submit} />
      <AdjustBalanceDialog open={adjustOpen} kind="LEAVE" ym={ym} error={adjustError} onClose={() => setAdjustOpen(false)} onSubmit={submitAdjust} />
      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this leave?"
        message="This day will be marked back as Working and your leave balance will be restored."
        confirmLabel="Cancel leave"
        loading={withdraw.isPending}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelling(null)}
      />
    </div>
  )
}
