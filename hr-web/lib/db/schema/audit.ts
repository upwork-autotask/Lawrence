import { jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk } from './common';

/** Append-only audit trail. The handler wrapper writes one row per mutation. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: pk(),
    actorId: uuid('actor_id'),
    action: text('action').notNull(), // create | update | delete | login | ...
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('audit_log_entity_idx').on(t.entityType, t.entityId),
    atIdx: index('audit_log_at_idx').on(t.at),
  }),
);

export type AuditEntry = typeof auditLog.$inferSelect;
