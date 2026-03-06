import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db/index";
import { tasks } from "../db/schema";
import type { Env, Variables } from "../index";

/**
 * In-memory sliding window rate limiter for POST /tasks.
 *
 * Configuration:
 *   - Window : 60 seconds
 *   - Limit  : 10 requests per tenant per window
 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // per tenant per window

const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(tenant_id: string): {
  exceeded: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();

  const timestamps = (rateLimitStore.get(tenant_id) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.ceil(
      (oldest + RATE_LIMIT_WINDOW_MS - now) / 1000,
    );
    return { exceeded: true, retryAfterSeconds };
  }

  timestamps.push(now);
  rateLimitStore.set(tenant_id, timestamps);

  return { exceeded: false, retryAfterSeconds: 0 };
}

const VALID_STATUSES = ["pending", "in_progress", "done"] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is TaskStatus {
  return VALID_STATUSES.includes(value as TaskStatus);
}

const tasksRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

tasksRouter.get("/", async (c) => {
  const tenant_id = c.get("tenant_id");
  const db = createDb(c.env.DATABASE_URL);

  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.tenant_id, tenant_id));

  return c.json({ data: result }, 200);
});

tasksRouter.post("/", async (c) => {
  const tenant_id = c.get("tenant_id");

  const rateLimit = checkRateLimit(tenant_id);

  if (rateLimit.exceeded) {
    return c.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: "Bad Request", message: "Request body must be valid JSON." },
      400,
    );
  }

  const title = body["title"];

  if (typeof title !== "string" || title.trim() === "") {
    return c.json(
      {
        error: "Bad Request",
        message: "`title` is required and must be a non-empty string.",
      },
      400,
    );
  }

  const rawStatus = body["status"];
  let status: TaskStatus = "pending";

  if (rawStatus !== undefined) {
    if (!isValidStatus(rawStatus)) {
      return c.json(
        {
          error: "Bad Request",
          message: `\`status\` must be one of: ${VALID_STATUSES.join(", ")}.`,
        },
        400,
      );
    }
    status = rawStatus;
  }

  const db = createDb(c.env.DATABASE_URL);

  const [created] = await db
    .insert(tasks)
    .values({
      title: title.trim(),
      status,
      tenant_id,
    })
    .returning();

  return c.json({ data: created }, 201);
});

tasksRouter.delete("/:id", async (c) => {
  const tenant_id = c.get("tenant_id");
  const id = c.req.param("id");

  // Basic UUID format guard — avoids a round-trip to the DB for garbage input
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_RE.test(id)) {
    return c.json(
      { error: "Bad Request", message: "`id` must be a valid UUID." },
      400,
    );
  }

  const db = createDb(c.env.DATABASE_URL);

  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.tenant_id, tenant_id)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Not Found", message: "Task not found." }, 404);
  }

  return c.json({ data: deleted }, 200);
});

export default tasksRouter;
