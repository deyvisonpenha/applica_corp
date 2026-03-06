import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * tasks table
 *
 * Tenant isolation is enforced at the query level — every read and write
 * filters by tenant_id so that data from one tenant is never accessible
 * to another, regardless of application logic above this layer.
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),

  title: text('title').notNull(),

  /**
   * Allowed values: 'pending' | 'in_progress' | 'done'
   * Kept as plain text (rather than a pg enum) so the schema stays
   * portable and easy to extend without a new migration for every value.
   */
  status: text('status').notNull().default('pending'),

  /**
   * Identifies which tenant owns this task.
   * Indexed for fast tenant-scoped queries.
   */
  tenant_id: text('tenant_id').notNull(),

  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ── Derived types ────────────────────────────────────────────────────────────

/** Shape returned by SELECT queries */
export type Task = typeof tasks.$inferSelect

/** Shape accepted by INSERT queries */
export type NewTask = typeof tasks.$inferInsert
