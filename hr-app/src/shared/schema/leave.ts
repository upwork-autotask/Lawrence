import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

/**
 * Leave type catalogue. Seeded (annual, sick, study, family responsibility, etc.).
 * Maps from legacy `TblTypeofLeave`.
 */
export const leaveTypes = sqliteTable(
  'leave_types',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    defaultDays: real('default_days').notNull().default(0),
    requiresAttachment: integer('requires_attachment', { mode: 'boolean' }).notNull().default(false),
    accrualPerMonth: real('accrual_per_month').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    nameIdx: uniqueIndex('leave_types_name_unique').on(t.name),
  }),
);

/**
 * Leave applications. Approval state stays as columns (line manager + HR), parity with Access.
 * Maps from legacy `TblLeaveForm`.
 */
export const leaveForms = sqliteTable(
  'leave_forms',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    leaveTypeId: integer('leave_type_id').notNull().references(() => leaveTypes.id),
    startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
    endDate: integer('end_date', { mode: 'timestamp_ms' }).notNull(),
    daysRequested: real('days_requested').notNull(),
    reason: text('reason'),
    attachmentPath: text('attachment_path'),
    status: text('status', {
      enum: ['draft', 'submitted', 'approved', 'rejected', 'cancelled'],
    })
      .notNull()
      .default('draft'),

    // Line manager step
    lineManagerId: integer('line_manager_id').references(() => employees.id),
    lineManagerDecidedAt: integer('line_manager_decided_at', { mode: 'timestamp_ms' }),
    lineManagerStatus: text('line_manager_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    lineManagerComments: text('line_manager_comments'),

    // HR step
    hrId: integer('hr_id').references(() => employees.id),
    hrDecidedAt: integer('hr_decided_at', { mode: 'timestamp_ms' }),
    hrStatus: text('hr_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    hrComments: text('hr_comments'),

    // Email notification state
    emailStatus: text('email_status', {
      enum: ['pending', 'sent', 'failed'],
    })
      .notNull()
      .default('pending'),

    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('leave_forms_employee_idx').on(t.employeeId),
    statusIdx: index('leave_forms_status_idx').on(t.status),
  }),
);

/**
 * Per-employee, per-leave-type annual balance ledger.
 * Maps from legacy `TblLeaveBalance` (and ad-hoc balance queries).
 */
export const leaveBalances = sqliteTable(
  'leave_balances',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    leaveTypeId: integer('leave_type_id').notNull().references(() => leaveTypes.id),
    year: integer('year').notNull(),
    allocated: real('allocated').notNull().default(0),
    taken: real('taken').notNull().default(0),
    pending: real('pending').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    employeeTypeYearIdx: uniqueIndex('leave_balances_employee_type_year_unique').on(
      t.employeeId,
      t.leaveTypeId,
      t.year,
    ),
  }),
);

export type LeaveType = typeof leaveTypes.$inferSelect;
export type NewLeaveType = typeof leaveTypes.$inferInsert;
export type LeaveForm = typeof leaveForms.$inferSelect;
export type NewLeaveForm = typeof leaveForms.$inferInsert;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
