import type { TaskPriority, TaskRow, TaskStatus } from '@/types/database'
import { formatShortDate, relativeDueLabel } from '@/utils/date'

export type TaskStats = { total: number; pending: number; completed: number } & Record<TaskStatus, number>

export function taskStats(tasks: ReadonlyArray<Pick<TaskRow, 'status'>>): TaskStats {
  const stats: TaskStats = { total: tasks.length, pending: 0, completed: 0, TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, COMPLETED: 0 }
  for (const t of tasks) stats[t.status] += 1
  stats.completed = stats.COMPLETED
  stats.pending = stats.total - stats.completed
  return stats
}

const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function compareDue<T extends Pick<TaskRow, 'due_date' | 'priority'>>(a: T, b: T): number {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date < b.due_date ? -1 : 1
  }
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
}

// Open tasks: due date ascending (undated last), then priority.
export function sortOpenTasks<T extends Pick<TaskRow, 'status' | 'due_date' | 'priority'>>(tasks: ReadonlyArray<T>): T[] {
  return tasks.filter((t) => t.status !== 'COMPLETED').toSorted(compareDue)
}

export type TaskSortKey = 'due' | 'priority' | 'created' | 'title'

export const TASK_SORT_META: Record<TaskSortKey, string> = {
  due: 'Due date',
  priority: 'Priority',
  created: 'Recently created',
  title: 'Title (A–Z)',
}

type SortableTask = Pick<TaskRow, 'status' | 'due_date' | 'priority' | 'created_at' | 'title' | 'completed_at'>

// Open tasks first (by the chosen criterion), completed tasks after — sorted
// by when they were completed, most recent first.
export function sortTasks<T extends SortableTask>(tasks: ReadonlyArray<T>, sort: TaskSortKey = 'due'): T[] {
  const compare = (a: T, b: T): number => {
    switch (sort) {
      case 'priority': {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        return diff !== 0 ? diff : compareDue(a, b)
      }
      case 'created':
        return b.created_at.localeCompare(a.created_at)
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return compareDue(a, b)
    }
  }

  const open = tasks.filter((t) => t.status !== 'COMPLETED').toSorted(compare)
  const done = tasks.filter((t) => t.status === 'COMPLETED').toSorted((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
  return [...open, ...done]
}

// A task can span a date range (start_date → due_date) instead of just a
// single due date. Falls back gracefully when only one end is set.
export function taskDateLabel(startDate: string | null, dueDate: string | null, done: boolean): string | null {
  if (startDate && dueDate && startDate !== dueDate) {
    return `${formatShortDate(startDate)} → ${done ? formatShortDate(dueDate) : relativeDueLabel(dueDate)}`
  }
  if (dueDate) return `Due: ${done ? formatShortDate(dueDate) : relativeDueLabel(dueDate)}`
  if (startDate) return `From: ${formatShortDate(startDate)}`
  return null
}
