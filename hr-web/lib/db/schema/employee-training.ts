// MODULE: Employee training assignment — per-employee internal/external training
// links (Access TblEmployeeTrainingDetails / TblEmployeeExTrainingDetails subforms).
// Unlike `training_internal`/`training_external` (booking/scheduling records) these
// simply bind a catalogue training to an EMPLOYEE, mirroring the Access subforms that
// the per-JD `jd_training_internal` tables could not reproduce.
import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';
import { trainingsCatalogue } from './training';

export const employeeTrainingInternal = pgTable(
  'employee_training_internal',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    trainingId: uuid('training_id').notNull().references(() => trainingsCatalogue.id),
    trainingType: text('training_type'), // joined display (Access TrainingType)
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').notNull().default('assigned'), // assigned|in_progress|completed
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('employee_training_internal_employee_idx').on(t.employeeId),
    trainingIdx: index('employee_training_internal_training_idx').on(t.trainingId),
  }),
);

export const employeeTrainingExternal = pgTable(
  'employee_training_external',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    trainingId: uuid('training_id').notNull().references(() => trainingsCatalogue.id),
    trainingType: text('training_type'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').notNull().default('assigned'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('employee_training_external_employee_idx').on(t.employeeId),
    trainingIdx: index('employee_training_external_training_idx').on(t.trainingId),
  }),
);

export type EmployeeTrainingInternal = typeof employeeTrainingInternal.$inferSelect;
export type EmployeeTrainingExternal = typeof employeeTrainingExternal.$inferSelect;
