import {
  boolean, doublePrecision, integer, pgTable, text, timestamp, uuid, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';
import { regions, departments } from './lookups';

/** Leave type catalogue. Maps from legacy `TblTypeofLeave`. */
export const leaveTypes = pgTable(
  'leave_types',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    defaultDays: doublePrecision('default_days').notNull().default(0),
    requiresAttachment: boolean('requires_attachment').notNull().default(false),
    accrualPerMonth: doublePrecision('accrual_per_month').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ nameIdx: uniqueIndex('leave_types_name_unique').on(t.name) }),
);

/** Leave applications. Approval kept as columns (line manager + HR), parity with Access. */
export const leaveForms = pgTable(
  'leave_forms',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    daysRequested: doublePrecision('days_requested').notNull(),
    reason: text('reason'),
    attachmentPath: text('attachment_path'),
    status: text('status').notNull().default('draft'), // draft|submitted|approved|rejected|cancelled

    regionId: uuid('region_id').references(() => regions.id),
    departmentId: uuid('department_id').references(() => departments.id),
    dateOfEngagement: timestamp('date_of_engagement', { withTimezone: true }),
    totalHolidays: doublePrecision('total_holidays'),
    approverId: uuid('approver_id').references(() => employees.id),

    lineManagerId: uuid('line_manager_id').references(() => employees.id),
    lineManagerDecidedAt: timestamp('line_manager_decided_at', { withTimezone: true }),
    lineManagerStatus: text('line_manager_status').notNull().default('pending'),
    lineManagerComments: text('line_manager_comments'),

    hrId: uuid('hr_id').references(() => employees.id),
    hrDecidedAt: timestamp('hr_decided_at', { withTimezone: true }),
    hrStatus: text('hr_status').notNull().default('pending'),
    hrComments: text('hr_comments'),

    emailStatus: text('email_status').notNull().default('pending'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('leave_forms_employee_idx').on(t.employeeId),
    statusIdx: index('leave_forms_status_idx').on(t.status),
  }),
);

/** Per-employee, per-type annual balance ledger. */
export const leaveBalances = pgTable(
  'leave_balances',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
    year: integer('year').notNull(),
    allocated: doublePrecision('allocated').notNull().default(0),
    taken: doublePrecision('taken').notNull().default(0),
    pending: doublePrecision('pending').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    etyIdx: uniqueIndex('leave_balances_employee_type_year_unique').on(t.employeeId, t.leaveTypeId, t.year),
  }),
);

export type LeaveType = typeof leaveTypes.$inferSelect;
export type LeaveForm = typeof leaveForms.$inferSelect;
export type NewLeaveForm = typeof leaveForms.$inferInsert;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
