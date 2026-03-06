import { useState } from "react";
import { useCreateTask } from "../hooks/useTasks";
import { ApiError, type TaskStatus } from "../api/tasks";
import type { Tenant } from "../types";

type Props = {
  tenant: Tenant;
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function CreateTaskForm({ tenant }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");

  const { mutate, isPending, error, reset } = useCreateTask(tenant);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    mutate(
      { title: title.trim(), status },
      {
        onSuccess: () => {
          setTitle("");
          setStatus("pending");
        },
      },
    );
  }

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Something went wrong."
        : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4"
    >
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        New Task
      </h2>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={reset}
            className="ml-4 text-red-400 hover:text-red-600 font-bold leading-none"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title…"
          disabled={isPending}
          required
          className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
        />

        {/* Status select */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          disabled={isPending}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white
                     focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md
                     hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Adding…" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
