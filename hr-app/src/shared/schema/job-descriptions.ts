// MODULE: Job Descriptions
// Legacy: TblJobDescription + entries + roles + KPIs + internal/external training + employee JD.
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

/**
 * A single Job Description (versioned). Approved by CEO; ties to a job title.
 * Maps from legacy `TblJobDescription`.
 */
export const jobDescriptions = sqliteTable(
  'job_descriptions',
  {
    id: pk(),
    title: text('title').notNull(),
    version: integer('version').notNull().default(1),
    status: text('status', {
      enum: ['draft', 'active', 'retired'],
    })
      .notNull()
      .default('draft'),
    summary: text('summary'),
    reportsToTitle: text('reports_to_title'),
    preparedBy: integer('prepared_by'),
    approvedByCeoAt: integer('approved_by_ceo_at', { mode: 'timestamp_ms' }),
    effectiveDate: integer('effective_date', { mode: 'timestamp_ms' }),
    retiredDate: integer('retired_date', { mode: 'timestamp_ms' }),
    ...auditColumns,
  },
  (t) => ({
    titleVersionIdx: uniqueIndex('job_descriptions_title_version_unique').on(t.title, t.version),
    statusIdx: index('job_descriptions_status_idx').on(t.status),
  }),
);

/**
 * Free-form narrative sections of a JD (purpose, scope, context, ...).
 * Maps from legacy `TblJobDescriptionEntries`.
 */
export const jdEntries = sqliteTable(
  'jd_entries',
  {
    id: pk(),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    section: text('section').notNull(),
    body: text('body'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    jdIdx: index('jd_entries_jd_idx').on(t.jdId),
  }),
);

/**
 * Roles & responsibilities lines for a JD, each weighted for KRA scoring.
 * Maps from legacy `TblJobDescriptionRolesResponsibilities`.
 */
export const jdRoles = sqliteTable(
  'jd_roles',
  {
    id: pk(),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    weight: real('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    jdIdx: index('jd_roles_jd_idx').on(t.jdId),
  }),
);

/**
 * KPIs attached to a JD. References the Performance module's `kpis` table.
 * Maps from legacy `TblJobDescriptionKPIs`.
 */
export const jdKpis = sqliteTable(
  'jd_kpis',
  {
    id: pk(),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    // TODO: cross-module FK to kpis once available
    kpiId: integer('kpi_id'),
    target: text('target'),
    weight: real('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    jdIdx: index('jd_kpis_jd_idx').on(t.jdId),
  }),
);

/**
 * Internal training requirements for a JD. References the Training module's catalogue.
 * Maps from legacy `TblJDTrainingInternal`.
 */
export const jdTrainingInternal = sqliteTable(
  'jd_training_internal',
  {
    id: pk(),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    // TODO: cross-module FK to trainings_catalogue once available
    trainingId: integer('training_id'),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    frequency: text('frequency'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    jdIdx: index('jd_training_internal_jd_idx').on(t.jdId),
  }),
);

/**
 * External training requirements for a JD. References the external training catalogue.
 * Maps from legacy `TblJDTrainingExternal`.
 */
export const jdTrainingExternal = sqliteTable(
  'jd_training_external',
  {
    id: pk(),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id, { onDelete: 'cascade' }),
    // TODO: cross-module FK to trainings_catalogue once available
    trainingId: integer('training_id'),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    frequency: text('frequency'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    jdIdx: index('jd_training_external_jd_idx').on(t.jdId),
  }),
);

/**
 * Assignment of a JD to an individual employee (with sign-off workflow).
 * Maps from legacy `TblEmployeeJobDescription`.
 */
export const employeeJds = sqliteTable(
  'employee_jds',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    jdId: integer('jd_id').notNull().references(() => jobDescriptions.id),
    assignedAt: integer('assigned_at', { mode: 'timestamp_ms' }).notNull(),
    lineManagerId: integer('line_manager_id'),
    hrId: integer('hr_id'),
    ceoApprovedAt: integer('ceo_approved_at', { mode: 'timestamp_ms' }),
    status: text('status', {
      enum: ['assigned', 'acknowledged', 'signed_off'],
    })
      .notNull()
      .default('assigned'),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeJdIdx: uniqueIndex('employee_jds_employee_jd_unique').on(t.employeeId, t.jdId),
    employeeIdx: index('employee_jds_employee_idx').on(t.employeeId),
  }),
);

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type NewJobDescription = typeof jobDescriptions.$inferInsert;
export type JdEntry = typeof jdEntries.$inferSelect;
export type NewJdEntry = typeof jdEntries.$inferInsert;
export type JdRole = typeof jdRoles.$inferSelect;
export type NewJdRole = typeof jdRoles.$inferInsert;
export type JdKpi = typeof jdKpis.$inferSelect;
export type NewJdKpi = typeof jdKpis.$inferInsert;
export type JdTrainingInternal = typeof jdTrainingInternal.$inferSelect;
export type NewJdTrainingInternal = typeof jdTrainingInternal.$inferInsert;
export type JdTrainingExternal = typeof jdTrainingExternal.$inferSelect;
export type NewJdTrainingExternal = typeof jdTrainingExternal.$inferInsert;
export type EmployeeJd = typeof employeeJds.$inferSelect;
export type NewEmployeeJd = typeof employeeJds.$inferInsert;
