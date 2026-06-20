// MODULE: Job Descriptions — legacy TblJobDescription + entries/roles/KPIs/training/employee JD.
import { boolean, doublePrecision, integer, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

export const jobDescriptions = pgTable(
  'job_descriptions',
  {
    id: pk(),
    title: text('title').notNull(),
    version: integer('version').notNull().default(1),
    status: text('status').notNull().default('draft'), // draft|active|retired
    summary: text('summary'),
    reportsToTitle: text('reports_to_title'),
    preparedBy: uuid('prepared_by'),
    approvedByCeoAt: timestamp('approved_by_ceo_at', { withTimezone: true }),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    retiredDate: timestamp('retired_date', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({
    titleVersionIdx: uniqueIndex('job_descriptions_title_version_unique').on(t.title, t.version),
    statusIdx: index('job_descriptions_status_idx').on(t.status),
  }),
);

export const jdEntries = pgTable(
  'jd_entries',
  {
    id: pk(),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    section: text('section').notNull(),
    body: text('body'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ jdIdx: index('jd_entries_jd_idx').on(t.jdId) }),
);

export const jdRoles = pgTable(
  'jd_roles',
  {
    id: pk(),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    weight: doublePrecision('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ jdIdx: index('jd_roles_jd_idx').on(t.jdId) }),
);

export const jdKpis = pgTable(
  'jd_kpis',
  {
    id: pk(),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    kpiId: uuid('kpi_id'), // cross-module ref to kpis (no FK, parity with Access convention)
    target: text('target'),
    weight: doublePrecision('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ jdIdx: index('jd_kpis_jd_idx').on(t.jdId) }),
);

export const jdTrainingInternal = pgTable(
  'jd_training_internal',
  {
    id: pk(),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    trainingId: uuid('training_id'),
    required: boolean('required').notNull().default(false),
    frequency: text('frequency'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ jdIdx: index('jd_training_internal_jd_idx').on(t.jdId) }),
);

export const jdTrainingExternal = pgTable(
  'jd_training_external',
  {
    id: pk(),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    trainingId: uuid('training_id'),
    required: boolean('required').notNull().default(false),
    frequency: text('frequency'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ jdIdx: index('jd_training_external_jd_idx').on(t.jdId) }),
);

export const employeeJds = pgTable(
  'employee_jds',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    jdId: uuid('jd_id').notNull().references(() => jobDescriptions.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull(),
    lineManagerId: uuid('line_manager_id'),
    hrId: uuid('hr_id'),
    ceoApprovedAt: timestamp('ceo_approved_at', { withTimezone: true }),
    status: text('status').notNull().default('assigned'), // assigned|acknowledged|signed_off
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeJdIdx: uniqueIndex('employee_jds_employee_jd_unique').on(t.employeeId, t.jdId),
    employeeIdx: index('employee_jds_employee_idx').on(t.employeeId),
  }),
);

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type JdEntry = typeof jdEntries.$inferSelect;
export type JdRole = typeof jdRoles.$inferSelect;
export type EmployeeJd = typeof employeeJds.$inferSelect;
