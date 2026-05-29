import { integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Standard audit columns every persisted table includes.
 * Spread into a Drizzle table definition.
 */
export const auditColumns = {
  legacyId: integer('legacy_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  syncVersion: integer('sync_version').notNull().default(0),
};

export const pk = () => integer('id').primaryKey({ autoIncrement: true });

export const optionalText = (name: string) => text(name);
export const requiredText = (name: string) => text(name).notNull();
