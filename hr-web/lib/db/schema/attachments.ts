import { integer, pgTable, text, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';

/**
 * Generic attachment table reused by every module (employee docs, disciplinary
 * evidence, leave certificates, ...). The binary lives in object storage; only
 * the key + metadata are persisted here.
 */
export const attachments = pgTable(
  'attachments',
  {
    id: pk(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    category: text('category'), // e.g. document type (Contract, Criminal check, …)
    storageKey: text('storage_key').notNull(),
    filename: text('filename').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull().default(0),
    uploadedBy: uuid('uploaded_by'),
    ...auditColumns,
  },
  (t) => ({ entityIdx: index('attachments_entity_idx').on(t.entityType, t.entityId) }),
);

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
