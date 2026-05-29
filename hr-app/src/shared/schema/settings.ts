import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';

/** Key/value singleton store for org settings (SMTP, branding, theme defaults). */
export const orgSettings = sqliteTable('org_settings', {
  id: pk(),
  key: text('key').notNull().unique(),
  value: text('value'),
  ...auditColumns,
});
