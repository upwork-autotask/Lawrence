import { boolean, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';

export const natureOfOffence = pgTable('nature_of_offence', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('nature_of_offence_name_unique').on(t.name),
}));

export const disciplinaryActions = pgTable('disciplinary_actions', lookupColumns, (t) => ({
  nameIdx: uniqueIndex('disciplinary_actions_name_unique').on(t.name),
}));

export const disciplinaryCases = pgTable(
  'disciplinary_cases',
  {
    id: pk(),
    caseNumber: text('case_number').notNull(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    offenceId: uuid('offence_id').notNull().references(() => natureOfOffence.id),
    actionId: uuid('action_id').references(() => disciplinaryActions.id),
    incidentDate: timestamp('incident_date', { withTimezone: true }).notNull(),
    reportedDate: timestamp('reported_date', { withTimezone: true }).notNull(),
    reportedBy: uuid('reported_by'),
    description: text('description').notNull(),
    status: text('status').notNull().default('open'), // open|under_investigation|hearing_scheduled|closed|withdrawn
    hearingDate: timestamp('hearing_date', { withTimezone: true }),
    outcome: text('outcome'),
    witnesses: text('witnesses'),
    evidencePath: text('evidence_path'),
    criminalReferral: boolean('criminal_referral').notNull().default(false),
    closedDate: timestamp('closed_date', { withTimezone: true }),
    closedBy: uuid('closed_by'),
    ...auditColumns,
  },
  (t) => ({
    caseNumberIdx: uniqueIndex('disciplinary_cases_case_number_unique').on(t.caseNumber),
    employeeIdx: index('disciplinary_cases_employee_idx').on(t.employeeId),
    statusIdx: index('disciplinary_cases_status_idx').on(t.status),
  }),
);

export const criminalReports = pgTable(
  'criminal_reports',
  {
    id: pk(),
    caseId: uuid('case_id').notNull().references(() => disciplinaryCases.id, { onDelete: 'cascade' }),
    reportedTo: text('reported_to').notNull(),
    reportNumber: text('report_number'),
    reportedDate: timestamp('reported_date', { withTimezone: true }).notNull(),
    status: text('status'),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ caseIdx: index('criminal_reports_case_idx').on(t.caseId) }),
);

export type NatureOfOffence = typeof natureOfOffence.$inferSelect;
export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type DisciplinaryCase = typeof disciplinaryCases.$inferSelect;
export type NewDisciplinaryCase = typeof disciplinaryCases.$inferInsert;
export type CriminalReport = typeof criminalReports.$inferSelect;
