// MODULE: Exit — termination + exit-interview records.
import { boolean, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';

export const exitReasons = pgTable('exit_reasons', lookupColumns);

/** Exit / termination record with exit-interview detail. */
export const exitRecords = pgTable(
  'exit_records',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    exitType: text('exit_type').notNull().default('resignation'), // resignation|dismissal|retirement|retrenchment|end_of_contract|death
    reasonId: uuid('reason_id').references(() => exitReasons.id),
    noticeDate: timestamp('notice_date', { withTimezone: true }),
    lastWorkingDay: timestamp('last_working_day', { withTimezone: true }),
    interviewDate: timestamp('interview_date', { withTimezone: true }),
    interviewerId: uuid('interviewer_id'),
    interviewNotes: text('interview_notes'),
    rehireEligible: boolean('rehire_eligible'),
    assetsReturned: boolean('assets_returned').notNull().default(false),
    finalSettlementPaid: boolean('final_settlement_paid').notNull().default(false),
    status: text('status').notNull().default('initiated'), // initiated|in_progress|completed|cancelled
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('exit_records_employee_idx').on(t.employeeId),
    statusIdx: index('exit_records_status_idx').on(t.status),
  }),
);

export type ExitReason = typeof exitReasons.$inferSelect;
export type ExitRecord = typeof exitRecords.$inferSelect;
