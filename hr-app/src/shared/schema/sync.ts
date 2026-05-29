import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { pk } from './common';
import { sql } from 'drizzle-orm';

/**
 * Append-only log of every local mutation. Drives the sync engine.
 * Adapters read pending rows and call back to mark accepted/conflict.
 */
export const syncOutbox = sqliteTable(
  'sync_outbox',
  {
    id: pk(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id').notNull(),
    op: text('op', { enum: ['insert', 'update', 'delete'] }).notNull(),
    payloadJson: text('payload_json').notNull(),
    baseVersion: integer('base_version').notNull(),
    lamport: integer('lamport').notNull(),
    userId: integer('user_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    status: text('status', { enum: ['pending', 'acknowledged', 'rejected'] }).notNull().default('pending'),
    acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp_ms' }),
    rejectionReason: text('rejection_reason'),
  },
  (t) => ({
    statusIdx: index('sync_outbox_status_idx').on(t.status),
    entityIdx: index('sync_outbox_entity_idx').on(t.entity, t.entityId),
  }),
);

/**
 * Conflict ledger — rows the remote rejected. Surfaced in admin UI for human merge.
 */
export const syncConflicts = sqliteTable(
  'sync_conflicts',
  {
    id: pk(),
    outboxId: integer('outbox_id').notNull(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id').notNull(),
    localPayload: text('local_payload').notNull(),
    remotePayload: text('remote_payload').notNull(),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    resolution: text('resolution', { enum: ['local_won', 'remote_won', 'manual'] }),
    resolvedBy: integer('resolved_by'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
);

/**
 * Singleton row tracking the highest lamport clock we've seen.
 * Used by `mutate()` to assign monotonic timestamps.
 */
export const syncClock = sqliteTable('sync_clock', {
  id: integer('id').primaryKey(),
  lamport: integer('lamport').notNull().default(0),
});
