// MODULE: Expenses & Car — legacy TblExpense, tblCarScheme, TblExpenseCategory, tblApproval.
import { doublePrecision, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';

export const expenseCategories = pgTable('expense_categories', lookupColumns);

/** Expense claims (TblExpense) with manager + finance approval columns. */
export const expenses = pgTable(
  'expenses',
  {
    id: pk(),
    claimNumber: text('claim_number'),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    categoryId: uuid('category_id').references(() => expenseCategories.id),
    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').notNull().default('ZAR'),
    description: text('description'),
    receiptPath: text('receipt_path'),
    status: text('status').notNull().default('draft'), // draft|submitted|approved|rejected|reimbursed

    managerId: uuid('manager_id'),
    managerDecidedAt: timestamp('manager_decided_at', { withTimezone: true }),
    managerStatus: text('manager_status').notNull().default('pending'),
    financeId: uuid('finance_id'),
    financeDecidedAt: timestamp('finance_decided_at', { withTimezone: true }),
    financeStatus: text('finance_status').notNull().default('pending'),
    reimbursedAt: timestamp('reimbursed_at', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('expenses_employee_idx').on(t.employeeId),
    statusIdx: index('expenses_status_idx').on(t.status),
  }),
);

/** Company car scheme allocations (tblCarScheme). */
export const carScheme = pgTable(
  'car_scheme',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    registration: text('registration'),
    makeModel: text('make_model'),
    year: text('year'),
    monthlyAllowance: doublePrecision('monthly_allowance'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    status: text('status').notNull().default('active'), // active|returned|suspended
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ employeeIdx: index('car_scheme_employee_idx').on(t.employeeId) }),
);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CarScheme = typeof carScheme.$inferSelect;
