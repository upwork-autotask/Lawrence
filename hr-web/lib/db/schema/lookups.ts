import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { lookupColumns } from './common';

// Org + classification lookups. Map from the many small Access lookup tables.
export const regions = pgTable('regions', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('regions_name_unique').on(t.name),
}));
export const departments = pgTable('departments', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('departments_name_unique').on(t.name),
}));
export const jobTitles = pgTable('job_titles', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('job_titles_name_unique').on(t.name),
}));
export const depots = pgTable('depots', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('depots_name_unique').on(t.name),
}));
export const tiers = pgTable('tiers', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('tiers_name_unique').on(t.name),
}));
export const patersonGrades = pgTable('paterson_grades', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('paterson_grades_name_unique').on(t.name),
}));
export const eeGroups = pgTable('ee_groups', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('ee_groups_name_unique').on(t.name),
}));
export const nbcCouncils = pgTable('nbc_councils', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('nbc_councils_name_unique').on(t.name),
}));
export const taxStatuses = pgTable('tax_statuses', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('tax_statuses_name_unique').on(t.name),
}));

/** The set of lookup tables exposed generically through the lookups API. */
export const lookupTables = {
  regions,
  departments,
  jobTitles,
  depots,
  tiers,
  patersonGrades,
  eeGroups,
  nbcCouncils,
  taxStatuses,
} as const;

export type LookupKey = keyof typeof lookupTables;
