# Task Manager — Full Stack

A multi-tenant task management application built with Cloudflare Workers + Hono on the backend and React + TanStack Query on the frontend.

---

## Project Structure

```
applica_corp/
├── backend/    # Cloudflare Worker · Hono · Drizzle ORM · Neon Postgres
└── frontend/   # React · TypeScript · TailwindCSS · TanStack Query
```

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime for both projects |
| npm | ≥ 9 | Package manager |
| Wrangler CLI | bundled in backend deps | Cloudflare Workers local dev + deploy |
| Neon account | — | Serverless Postgres database |

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create a Neon database

1. Go to [console.neon.tech](https://console.neon.tech) and create a project
2. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

### 3. Configure local secrets

Copy the example file and fill in real values:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```ini
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
TENANT_A_TOKEN="dev-token-tenant-a"
TENANT_B_TOKEN="dev-token-tenant-b"
```

> The token values can be any string locally. For production use strong random secrets —
> see the note in the file for how to generate them.

### 4. Run the database migration

```bash
DATABASE_URL="your-connection-string" npm run db:migrate
```

This applies `drizzle/0000_*.sql` to your Neon database, creating the `tasks` table.

### 5. Start the local dev server

```bash
npm run dev
```

Wrangler starts the Worker at **http://localhost:8787**.

### Backend environment variables

| Variable | Where to set | Description |
|---|---|---|
| `DATABASE_URL` | `.dev.vars` / `wrangler secret put` | Neon Postgres connection string |
| `TENANT_A_TOKEN` | `.dev.vars` / `wrangler secret put` | Bearer token for tenant_a |
| `TENANT_B_TOKEN` | `.dev.vars` / `wrangler secret put` | Bearer token for tenant_b |

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```ini
VITE_API_URL=http://localhost:8787
VITE_TENANT_A_TOKEN=dev-token-tenant-a
VITE_TENANT_B_TOKEN=dev-token-tenant-b
```

> Token values must match the ones set in `backend/.dev.vars`.

### 3. Start the dev server

```bash
npm run dev
```

Vite starts the app at **http://localhost:5173**.

### Frontend environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend Worker (local: `http://localhost:8787`) |
| `VITE_TENANT_A_TOKEN` | Bearer token sent when operating as tenant_a |
| `VITE_TENANT_B_TOKEN` | Bearer token sent when operating as tenant_b |

> All variables must be prefixed with `VITE_` — Vite only exposes variables with this prefix to the browser bundle.

---

## Running the Full Stack Locally

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Reference

### Authentication

Every request to `/tasks` must include a Bearer token:

```
Authorization: Bearer <token>
```

Requests without a valid token return `401 Unauthorized`.

### Endpoints

#### `GET /tasks`
Returns all tasks belonging to the authenticated tenant.

```
curl http://localhost:8787/tasks \
  -H "Authorization: Bearer dev-token-tenant-a"
```

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My task",
      "status": "pending",
      "tenant_id": "tenant_a",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `POST /tasks`
Creates a new task for the authenticated tenant.

```
curl -X POST http://localhost:8787/tasks \
  -H "Authorization: Bearer dev-token-tenant-a" \
  -H "Content-Type: application/json" \
  -d '{"title": "My task", "status": "in_progress"}'
```

**Body fields**

| Field | Type | Required | Values |
|---|---|---|---|
| `title` | string | ✅ | Non-empty string |
| `status` | string | ❌ | `pending` · `in_progress` · `done` (default: `pending`) |

> `tenant_id` in the request body is ignored — it is always resolved from the Bearer token server-side.

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "title": "My task",
    "status": "in_progress",
    "tenant_id": "tenant_a",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Rate limiting:** Maximum **10 requests per minute** per tenant. Exceeding the limit returns `429 Too Many Requests` with a `Retry-After` header.

---

#### `DELETE /tasks/:id`
Deletes a task by id. The task must belong to the authenticated tenant.

```
curl -X DELETE http://localhost:8787/tasks/<uuid> \
  -H "Authorization: Bearer dev-token-tenant-a"
```

**Response `200`** — deleted task object
**Response `404`** — task not found or belongs to a different tenant

---

#### `GET /health`
Public endpoint — no authentication required.

```
curl http://localhost:8787/health
# {"status":"ok"}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request (invalid body, missing title, invalid UUID) |
| `401` | Missing or invalid Bearer token |
| `404` | Task not found or not owned by the authenticated tenant |
| `429` | Rate limit exceeded on `POST /tasks` |

---

## Useful Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start local Worker with Wrangler |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run type-check` | Run TypeScript type checking |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | Run TypeScript type checking |

---

## Assumptions Made

### Authentication
- Two tenants (`tenant_a`, `tenant_b`) are hardcoded — there is no user registration or token issuance flow. Tokens are static strings configured via environment secrets.
- A single token maps to a single tenant. There is no concept of multiple users within the same tenant for this exercise.

### Tenant Isolation
- Isolation is enforced at the **database query level** on every read and write — `WHERE tenant_id = ?` is always present. Application-level checks alone are not relied upon.
- `DELETE` uses a compound `WHERE id = ? AND tenant_id = ?` clause. The server never fetches a row first to check ownership, eliminating any TOCTOU race window.
- A `404` is returned whether a task doesn't exist *or* belongs to another tenant — this prevents confirming the existence of another tenant's task IDs.

### Rate Limiting
- Rate limiting is **in-memory and per-isolate**. Cloudflare Workers can run across multiple isolate instances under load, so the effective limit could be higher than 10 req/min globally. A production-grade solution would use Cloudflare Durable Objects or KV for a shared counter.
- The limit applies only to `POST /tasks` as specified. `GET` and `DELETE` are not rate-limited.

### Database
- `status` is stored as plain `text` rather than a Postgres `enum`. This avoids requiring a new migration every time a status value is added, at the cost of the constraint living in application code rather than the database schema.
- UUIDs are used as primary keys (`gen_random_uuid()`) to avoid sequential IDs that could be guessed or enumerated across tenants.

### Frontend
- Tenant selection is local React state — there is no session persistence. Refreshing the page resets to `tenant_a`.
- Both tenant tokens are shipped to the browser via Vite environment variables. This is acceptable for a local/demo setup; in a real product, tokens would be issued server-side after a login flow and never embedded in the client bundle.
- The frontend does not implement rate-limit feedback beyond surfacing the API error message returned by the backend.

### General
- No test suite is included. The codebase is structured to make unit testing straightforward — API functions, query hooks, and components are each independently importable with no hidden global state.
- CORS is configured via Hono's built-in `cors` middleware, mounted as the very first handler so it intercepts `OPTIONS` preflight requests before the auth middleware runs (a preflight carries no `Authorization` header and would otherwise return `401`). The allowed origin is driven by the `ALLOWED_ORIGIN` environment variable and falls back to `*` when not set — acceptable here because authentication is enforced by Bearer tokens, not by origin. For production, set `ALLOWED_ORIGIN` to the exact frontend URL via `wrangler secret put ALLOWED_ORIGIN`.

---

## Challenge questions

### 1. How would you approach implementing DMARC and DKIM configuration for a platform hosted on Cloudflare? What is the purpose of each?

Both live as DNS TXT records. Cloudflare's proxy does not touch email traffic, so this is purely DNS configuration inside the Cloudflare dashboard.

**DKIM** proves an email genuinely came from your domain and was not altered in transit. Your email provider (SendGrid, Postmark, etc.) generates a private/public key pair. The private key signs outgoing mail, and you publish the public key as a `TXT` record (e.g. `mail._domainkey.yourdomain.com`). Receiving servers then verify the signature against that record.

**DMARC** is the policy layer. It tells receiving servers what to do when DKIM or SPF fails, with three options: `none` (monitor only), `quarantine` (send to spam folder), or `reject` (drop the message entirely). It also specifies a `rua` address to receive aggregate reports, giving you visibility into who is sending mail on behalf of your domain. The right approach is to start with `p=none` to observe legitimate sending sources, then tighten to `reject` once all of them are confirmed.

---

### 2. A user reports they can see tasks that don't belong to them. Walk us through how you would debug and fix this in a multi-tenant system.

First, try to reproduce it with the exact tenant credentials the user reported. The goal is to confirm it is a real data leak and not a UI caching artifact. TanStack Query keys results by tenant, so if the `queryKey` was wrong, it could serve stale data from a previous tenant selection without ever making a bad request to the server.

If confirmed at the network level, move to the query layer immediately. The bug is almost certainly one of three things: the `WHERE tenant_id = ?` clause is missing on a code path, `c.get('tenant_id')` is returning an incorrect value from the auth middleware, or a missing `await` is causing the wrong context to be used. Adding structured logging to capture `tenant_id` and the raw SQL parameters on every request, then replaying the failing scenario, will isolate which one it is.

Beyond correcting the query, the right fix is adding **Postgres Row-Level Security** as a hard backstop. RLS enforces isolation at the database engine level regardless of application logic, so even a future regression cannot leak data across tenants.

---

### 3. What would your automated daily database backup strategy look like for a Neon Postgres database? How would you verify it is working?

Neon provides continuous WAL-based backups with point-in-time recovery out of the box, and that is the foundation. On top of that, a nightly `pg_dump` should run via a scheduled Cloudflare Worker (Cron Job to be at the same environment) or a GitHub Actions workflow, piping the output compressed to **Cloudflare R2** (or S3) with a date-stamped key and object versioning enabled. Retention policy: 30 daily snapshots and 12 monthly snapshots, with older ones automatically expired via a lifecycle rule.

Verification is what most teams skip. A weekly automated restore job should run in an isolated environment: spin up a throwaway Neon branch, restore the latest dump into it, run a row count check against known seed data, then tear it down. If the restore job fails or the counts are off, an alert fires. A backup you have never restored is not a backup; it is a hypothesis.
