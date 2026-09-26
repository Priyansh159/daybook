import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { TaskRow } from '@/types/database'
import type { TaskStats } from '@/utils/tasks'
import { todayIso } from '@/utils/date'
import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Feedback'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'

type Tile = { key: string; label: string; value: number; accent: string; predicate: (t: TaskRow) => boolean }

export function TaskOverviewCard({ stats, tasks, loading }: { stats: TaskStats; tasks: TaskRow[]; loading?: boolean }) {
  const today = todayIso()
  const [activeTile, setActiveTile] = useState<Tile | null>(null)
  const [viewingTask, setViewingTask] = useState<TaskRow | null>(null)

  const tiles: Tile[] = [
    { key: 'total', label: 'Total', value: stats.total, accent: 'text-slate-900 dark:text-slate-100', predicate: () => true },
    {
      key: 'pending',
      label: 'Pending',
      value: stats.pending,
      accent: 'text-amber-600 dark:text-amber-400',
      predicate: (t) => t.status !== 'COMPLETED',
    },
    {
      key: 'completed',
      label: 'Completed',
      value: stats.completed,
      accent: 'text-emerald-600 dark:text-emerald-400',
      predicate: (t) => t.status === 'COMPLETED',
    },
  ]
  if (stats.overdue > 0) {
    tiles.push({
      key: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      accent: 'text-red-600 dark:text-red-400',
      predicate: (t) => t.status !== 'COMPLETED' && t.due_date !== null && t.due_date < today,
    })
  }
  if (stats.dueToday > 0) {
    tiles.push({
      key: 'due-today',
      label: 'Due today',
      value: stats.dueToday,
      accent: 'text-blue-600 dark:text-blue-400',
      predicate: (t) => t.due_date === today,
    })
  }
  if (stats.highPriorityOpen > 0) {
    tiles.push({
      key: 'high-priority',
      label: 'High priority',
      value: stats.highPriorityOpen,
      accent: 'text-purple-600 dark:text-purple-400',
      predicate: (t) => t.status !== 'COMPLETED' && t.priority === 'HIGH',
    })
  }

  const filteredTasks = useMemo(() => (activeTile ? tasks.filter(activeTile.predicate) : []), [activeTile, tasks])

  return (
    <Card
      title="Tasks"
      description="Your overall progress across every open and completed task"
      actions={
        <Link to="/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
          View all
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ProgressBar
            value={stats.completed}
            max={stats.total}
            size="md"
            label={stats.total ? `${stats.completed} of ${stats.total} tasks completed` : 'No tasks yet'}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {tiles.map((tile) => (
              <motion.button
                key={tile.key}
                type="button"
                onClick={() => setActiveTile(tile)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm transition-colors hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{tile.label}</p>
                <p className={cn('mt-1 text-xl font-semibold tabular-nums', tile.accent)}>{tile.value}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <Dialog open={Boolean(activeTile)} onClose={() => setActiveTile(null)} title={activeTile?.label ?? ''} size="sm">
        {activeTile && (
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tasks match this filter.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setViewingTask(task)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-brand-400 dark:border-slate-800 dark:hover:border-brand-500"
                  >
                    <span className={cn('truncate font-medium', task.status === 'COMPLETED' && 'text-slate-400 line-through dark:text-slate-500')}>
                      {task.title}
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
                      <Badge tone={TASK_PRIORITY_META[task.priority].tone}>{TASK_PRIORITY_META[task.priority].label}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 text-right dark:border-slate-800">
              <Link
                to="/tasks"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() => setActiveTile(null)}
              >
                Open full task list →
              </Link>
            </div>
          </div>
        )}
      </Dialog>
      <TaskDetailDialog task={viewingTask} onClose={() => setViewingTask(null)} />
    </Card>
  )
}
