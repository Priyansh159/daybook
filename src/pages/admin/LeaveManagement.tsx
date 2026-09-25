import { useState } from 'react'
import { useEmployeeMap } from '@/hooks/useEmployee'
import { useLeaveRequests, useReviewLeave } from '@/hooks/useLeave'
import { formatShortDate } from '@/utils/date'
import { formatDays, LEAVE_TYPE_LABEL, REQUEST_STATUS_META } from '@/utils/formatters'
import { toUserMessage } from '@/lib/errors'
import type { RequestStatus } from '@/types/database'
import { useToast } from '@/hooks/useToast'
import { PageHeader, Tabs } from '@/components/ui/Navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback'

const TABS: { value: RequestStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'History' },
]

export default function LeaveManagement() {
  const toast = useToast()
  const [tab, setTab] = useState<RequestStatus>('PENDING')
  const employees = useEmployeeMap()
  const requests = useLeaveRequests({ status: tab })
  const review = useReviewLeave()
  const [busyId, setBusyId] = useState<string | null>(null)

  const act = async (id: string, status: Exclude<RequestStatus, 'PENDING'>) => {
    setBusyId(id)
    try {
      await review.mutateAsync({ id, status })
      toast.success('Leave request updated')
    } catch (err) {
      toast.error(toUserMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Leave Management" description="Review and adjust employee leave requests" />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <Card bodyClassName="p-0" className="mt-4">
        {requests.isPending || employees.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={5} />
          </div>
        ) : requests.error ? (
          <div className="p-5">
            <ErrorState error={requests.error} onRetry={() => void requests.refetch()} />
          </div>
        ) : requests.data?.length === 0 ? (
          <EmptyState title="No leave requests found." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Duration</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </THead>
            <TBody>
              {requests.data?.map((r) => (
                <tr key={r.id}>
                  <Td>{employees.map.get(r.employee_id)?.full_name ?? '—'}</Td>
                  <Td>{formatShortDate(r.date)}</Td>
                  <Td>{LEAVE_TYPE_LABEL[r.leave_type]}</Td>
                  <Td>{formatDays(r.duration)}</Td>
                  <Td className="max-w-xs truncate">{r.reason || '—'}</Td>
                  <Td>
                    <Badge tone={REQUEST_STATUS_META[r.status].tone}>{REQUEST_STATUS_META[r.status].label}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <Button size="sm" loading={busyId === r.id} onClick={() => void act(r.id, 'APPROVED')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => void act(r.id, 'REJECTED')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50" loading={busyId === r.id} onClick={() => void act(r.id, 'CANCELLED')}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
