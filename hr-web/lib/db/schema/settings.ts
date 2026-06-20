import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';

/** Key/value singleton store for org settings (SMTP, branding, theme defaults). */
export const orgSettings = pgTable(
  'org_settings',
  {
    id: pk(),
    key: text('key').notNull(),
    value: text('value'),
    ...auditColumns,
  },
  (t) => ({ keyIdx: uniqueIndex('org_settings_key_unique').on(t.key) }),
);

export type OrgSetting = typeof orgSettings.$inferSelect;
