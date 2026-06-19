import { boolean, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Standard columns every persisted table carries.
 * - `updatedAt` doubles as the optimistic-concurrency token (PATCH must send the
 *   last-seen value; a mismatch yields HTTP 409).
 * - `legacyId` maps the row back to its Microsoft Access origin for traceability.
 * Spread into a pgTable definition: `{ id: pk(), ...auditColumns }`.
 */
export const auditColumns = {
  legacyId: integer('legacy_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

export const pk = () => uuid('id').primaryKey().defaultRandom();

/** Columns shared by every simple lookup/catalogue table. */
export const lookupColumns = {
  id: pk(),
  code: text('code'),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...auditColumns,
};
