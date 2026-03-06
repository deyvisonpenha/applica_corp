import { useTasks } from '../hooks/useTasks'
import { ApiError } from '../api/tasks'
import { TaskItem } from './TaskItem'
import type { Tenant } from '../types'

type Props = {
  tenant: Tenant
}

export function TaskList({ tenant }: Props) {
  const { data, isLoading, isError, error } = useTasks(tenant)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <svg
          className="animate-spin h-5 w-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-sm">Loading tasks…</span>
      </div>
    )
  }

  if (isError) {
    const message =
      error instanceof ApiError
        ? `${error.message} (${error.status})`
        : 'An unexpected error occurred.'

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span className="font-medium">Error:</span> {message}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg
          className="h-8 w-8 mb-2 opacity-40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm">No tasks yet. Create one above.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((task) => (
        <TaskItem key={task.id} task={task} tenant={tenant} />
      ))}
    </ul>
  )
}
