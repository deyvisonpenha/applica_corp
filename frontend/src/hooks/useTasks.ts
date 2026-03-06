import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTasks,
  createTask,
  deleteTask,
  type CreateTaskInput,
} from "../api/tasks";
import type { Tenant } from "../types";

/**
 * Centralised query key factory.
 *
 * Using a factory instead of inline arrays guarantees that the key used in
 * useQuery always matches the key used in invalidateQueries — no typos, no
 * stale cache entries left behind after a mutation.
 *
 * ['tasks', 'tenant_a'] and ['tasks', 'tenant_b'] are separate cache entries,
 * so switching tenants immediately shows the correct data for each.
 */
const taskKeys = {
  all: (tenant: Tenant) => ["tasks", tenant] as const,
};

/**
 * Fetches all tasks for the given tenant.
 *
 * The query is re-executed automatically when `tenant` changes, because
 * the query key includes the tenant value. TanStack Query caches each
 * tenant's data independently, so switching back to a previously loaded
 * tenant shows cached data instantly (within staleTime) without a new request.
 */
export function useTasks(tenant: Tenant) {
  return useQuery({
    queryKey: taskKeys.all(tenant),
    queryFn: () => fetchTasks(tenant),
  });
}

/**
 * Creates a new task for the given tenant.
 *
 * On success, invalidates the task list cache for the current tenant so the
 * new task appears immediately without a manual refetch.
 *
 * Usage:
 *   const { mutate, isPending, error } = useCreateTask(tenant)
 *   mutate({ title: 'My task' })
 *   mutate({ title: 'My task', status: 'in_progress' })
 */
export function useCreateTask(tenant: Tenant) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(tenant, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(tenant) });
    },
  });
}

/**
 * Deletes a task by id for the given tenant.
 *
 * On success, invalidates the task list cache for the current tenant so the
 * deleted task disappears immediately without a manual refetch.
 *
 * The server enforces tenant ownership — a task from another tenant will
 * return 404, which surfaces as an ApiError in the mutation's error state.
 *
 * Usage:
 *   const { mutate, isPending } = useDeleteTask(tenant)
 *   mutate(taskId)
 */
export function useDeleteTask(tenant: Tenant) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(tenant, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(tenant) });
    },
  });
}
