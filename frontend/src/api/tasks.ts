import type { Tenant } from "../types";

export type TaskStatus = "pending" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  tenant_id: string;
  created_at: string;
};

export type CreateTaskInput = {
  title: string;
  status?: TaskStatus;
};

const BASE_URL = import.meta.env.VITE_API_URL as string;

const TENANT_TOKENS: Record<Tenant, string> = {
  tenant_a: import.meta.env.VITE_TENANT_A_TOKEN as string,
  tenant_b: import.meta.env.VITE_TENANT_B_TOKEN as string,
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(tenant: Tenant): string {
  return TENANT_TOKENS[tenant];
}

function authHeaders(tenant: Tenant): HeadersInit {
  return {
    Authorization: `Bearer ${getToken(tenant)}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;

    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // body was not valid JSON — explicitly fall back to the HTTP status text
      message = res.statusText;
    }

    throw new ApiError(res.status, message);
  }

  try {
    const body = (await res.json()) as { data: T };
    return body.data;
  } catch {
    // Response was 2xx but body was not valid JSON — surface as a typed error
    // so components using `error instanceof ApiError` can handle it uniformly.
    throw new ApiError(
      res.status,
      "Response body could not be parsed as JSON.",
    );
  }
}

export async function fetchTasks(tenant: Tenant): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: authHeaders(tenant),
  });

  return handleResponse<Task[]>(res);
}

export async function createTask(
  tenant: Tenant,
  input: CreateTaskInput,
): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(tenant),
    body: JSON.stringify(input),
  });

  return handleResponse<Task>(res);
}

export async function deleteTask(tenant: Tenant, id: string): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(tenant),
  });

  return handleResponse<Task>(res);
}
