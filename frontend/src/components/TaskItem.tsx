import { Task, TaskStatus } from '../api/tasks'
import { useDeleteTask } from '../hooks/useTasks'
import type { Tenant } from '../types'

type Props = {
  task: Task
  tenant: Tenant
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
}

export function TaskItem({ task, tenant }: Props) {
  const { mutate, isPending } = useDeleteTask(tenant)

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Left: status badge + title */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
        <span className="text-slate-800 text-sm truncate">{task.title}</span>
      </div>

      {/* Right: date + delete */}
      <div className="flex items-center gap-4 ml-4 shrink-0">
        <span className="text-xs text-slate-400">
          {new Date(task.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={() => mutate(task.id)}
          disabled={isPending}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
