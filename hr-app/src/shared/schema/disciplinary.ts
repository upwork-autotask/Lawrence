// MODULE: Disciplinary
// Legacy: TblDisciplinary, tblNatureOfOffence, tblDisciplinaryAction, TblCriminalReport.
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

const lookupColumns = {
  id: pk(),
  code: text('code'),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...auditColumns,
};

export const natureOfOffence = sqliteTable('nature_of_offence', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('nature_of_offence_name_unique').on(t.name),
}));

export const disciplinaryActions = sqliteTable('disciplinary_actions', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('disciplinary_actions_name_unique').on(t.name),
}));

export const disciplinaryCases = sqliteTable(
  'disciplinary_cases',
  {
    id: pk(),
    caseNumber: text('case_number').notNull(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    offenceId: integer('offence_id').notNull().references(() => natureOfOffence.id),
    actionId: integer('action_id').references(() => disciplinaryActions.id),
    incidentDate: integer('incident_date', { mode: 'timestamp_ms' }).notNull(),
    reportedDate: integer('reported_date', { mode: 'timestamp_ms' }).notNull(),
    reportedBy: integer('reported_by'),
    description: text('description').notNull(),
    status: text('status', {
      enum: ['open', 'under_investigation', 'hearing_scheduled', 'closed', 'withdrawn'],
    }).notNull().default('open'),
    hearingDate: integer('hearing_date', { mode: 'timestamp_ms' }),
    outcome: text('outcome'),
    witnesses: text('witnesses'),
    evidencePath: text('evidence_path'),
    criminalReferral: integer('criminal_referral').notNull().default(0),
    closedDate: integer('closed_date', { mode: 'timestamp_ms' }),
    closedBy: integer('closed_by'),
    ...auditColumns,
  },
  (t) => ({
    caseNumberIdx: uniqueIndex('disciplinary_cases_case_number_unique').on(t.caseNumber),
    employeeIdx: index('disciplinary_cases_employee_idx').on(t.employeeId),
    statusIdx: index('disciplinary_cases_status_idx').on(t.status),
  }),
);

export const criminalReports = sqliteTable(
  'criminal_reports',
  {
    id: pk(),
    caseId: integer('case_id').notNull().references(() => disciplinaryCases.id, { onDelete: 'cascade' }),
    reportedTo: text('reported_to').notNull(),
    reportNumber: text('report_number'),
    reportedDate: integer('reported_date', { mode: 'timestamp_ms' }).notNull(),
    status: text('status'),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    caseIdx: index('criminal_reports_case_idx').on(t.caseId),
  }),
);

export type NatureOfOffence = typeof natureOfOffence.$inferSelect;
export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type DisciplinaryCase = typeof disciplinaryCases.$inferSelect;
export type CriminalReport = typeof criminalReports.$inferSelect;
export type NewDisciplinaryCase = typeof disciplinaryCases.$inferInsert;
export type NewCriminalReport = typeof criminalReports.$inferInsert;
