import { describe, expect, it } from 'vitest'
import { sortOpenTasks, sortTasks, taskDateLabel, taskStats } from '@/utils/tasks'
import type { TaskPriority, TaskStatus } from '@/types/database'

type Overrides = Partial<{
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  title: string
  created_at: string
  completed_at: string | null
}>

function task(overrides: Overrides) {
  return {
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    due_date: null,
    title: 'Untitled',
    created_at: '2026-01-01T00:00:00Z',
    completed_at: null,
    ...overrides,
  }
}

describe('taskStats', () => {
  it('splits pending vs completed', () => {
    const tasks = [task({ status: 'TODO' }), task({ status: 'IN_PROGRESS' }), task({ status: 'COMPLETED' }), task({ status: 'COMPLETED' })]
    expect(taskStats(tasks)).toMatchObject({ total: 4, pending: 2, completed: 2 })
  })

  it('counts overdue, due-today, and high-priority-open tasks, ignoring completed ones', () => {
    const tasks = [
      task({ status: 'TODO', due_date: '2020-01-01', priority: 'HIGH' }), // overdue + high priority
      task({ status: 'IN_PROGRESS', due_date: '2099-01-01', priority: 'HIGH' }), // high priority, not overdue
      task({ status: 'COMPLETED', due_date: '2020-01-01', priority: 'HIGH' }), // completed — excluded from all three
      task({ status: 'TODO', due_date: null, priority: 'LOW' }),
    ]
    const stats = taskStats(tasks, () => '2026-06-15')
    expect(stats.overdue).toBe(1)
    expect(stats.highPriorityOpen).toBe(2)
    expect(stats.dueToday).toBe(0)
  })

  it('counts a task due exactly today', () => {
    const stats = taskStats([task({ status: 'TODO', due_date: '2026-06-15' })], () => '2026-06-15')
    expect(stats.dueToday).toBe(1)
  })
})

describe('sortOpenTasks', () => {
  it('excludes completed tasks', () => {
    const tasks = [task({ status: 'COMPLETED' }), task({ status: 'TODO' })]
    expect(sortOpenTasks(tasks)).toHaveLength(1)
  })

  it('sorts by due date ascending, undated tasks last', () => {
    const tasks = [task({ due_date: '2026-10-05' }), task({ due_date: null }), task({ due_date: '2026-10-01' })]
    expect(sortOpenTasks(tasks).map((t) => t.due_date)).toEqual(['2026-10-01', '2026-10-05', null])
  })

  it('breaks ties on the same due date by priority (HIGH first)', () => {
    const tasks = [task({ due_date: '2026-10-01', priority: 'LOW' }), task({ due_date: '2026-10-01', priority: 'HIGH' })]
    expect(sortOpenTasks(tasks).map((t) => t.priority)).toEqual(['HIGH', 'LOW'])
  })
})

describe('sortTasks', () => {
  it('puts completed tasks after open ones, sorted by most recently completed', () => {
    const tasks = [
      task({ status: 'COMPLETED', title: 'old', completed_at: '2026-01-01T00:00:00Z' }),
      task({ status: 'TODO', title: 'open' }),
      task({ status: 'COMPLETED', title: 'recent', completed_at: '2026-02-01T00:00:00Z' }),
    ]
    expect(sortTasks(tasks).map((t) => t.title)).toEqual(['open', 'recent', 'old'])
  })

  it('sorts open tasks by priority when asked', () => {
    const tasks = [task({ priority: 'LOW', title: 'low' }), task({ priority: 'HIGH', title: 'high' })]
    expect(sortTasks(tasks, 'priority').map((t) => t.title)).toEqual(['high', 'low'])
  })

  it('sorts open tasks by title when asked', () => {
    const tasks = [task({ title: 'Zebra' }), task({ title: 'Apple' })]
    expect(sortTasks(tasks, 'title').map((t) => t.title)).toEqual(['Apple', 'Zebra'])
  })
})

describe('taskDateLabel', () => {
  // `done: true` is used throughout so the assertions don't depend on the
  // wall-clock "today" (the open-task path uses relativeDueLabel).
  it('shows a range when start and due dates differ', () => {
    expect(taskDateLabel('2026-09-20', '2026-09-25', true)).toBe('20 Sep 2026 → 25 Sep 2026')
  })

  it('falls back to just the due date', () => {
    expect(taskDateLabel(null, '2026-09-25', true)).toBe('Due: 25 Sep 2026')
  })

  it('falls back to just the start date when there is no due date', () => {
    expect(taskDateLabel('2026-09-20', null, true)).toBe('From: 20 Sep 2026')
  })

  it('returns null when neither date is set', () => {
    expect(taskDateLabel(null, null, true)).toBeNull()
  })
})
