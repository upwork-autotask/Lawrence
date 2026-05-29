import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';

const lookupColumns = {
  id: pk(),
  code: text('code'),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...auditColumns,
};

export const regions = sqliteTable('regions', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('regions_name_unique').on(t.name),
}));

export const departments = sqliteTable('departments', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('departments_name_unique').on(t.name),
}));

export const jobTitles = sqliteTable('job_titles', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('job_titles_name_unique').on(t.name),
}));

export const depots = sqliteTable('depots', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('depots_name_unique').on(t.name),
}));

export const tiers = sqliteTable('tiers', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('tiers_name_unique').on(t.name),
}));

export const patersonGrades = sqliteTable('paterson_grades', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('paterson_grades_name_unique').on(t.name),
}));

export const eeGroups = sqliteTable('ee_groups', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('ee_groups_name_unique').on(t.name),
}));

export const nbcCouncils = sqliteTable('nbc_councils', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('nbc_councils_name_unique').on(t.name),
}));

export const taxStatuses = sqliteTable('tax_statuses', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('tax_statuses_name_unique').on(t.name),
}));
