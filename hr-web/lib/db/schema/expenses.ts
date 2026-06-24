// MODULE: Expenses & Car — legacy TblExpense, tblCarScheme, TblExpenseCategory, tblApproval.
import { doublePrecision, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';
import { depots, costOfSale, activities, overheads } from './lookups';

export const expenseCategories = pgTable('expense_categories', lookupColumns);

/**
 * Expense claims (TblExpense) with the Access cost-allocation, VAT and manager
 * approval model. `amount` is the VAT-inclusive total (Access TotalAmount):
 * amount = costExVat + vatAmount, where vatAmount = costExVat * vatRate / 100.
 */
export const expenses = pgTable(
  'expenses',
  {
    id: pk(),
    claimNumber: text('claim_number'), // Access RefNo
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    categoryId: uuid('category_id').references(() => expenseCategories.id),

    // Cost allocation (Access DepotID / CostOfSaleID / ActivitiesID / OverheadsID).
    depotId: uuid('depot_id').references(() => depots.id),
    costOfSaleId: uuid('cost_of_sale_id').references(() => costOfSale.id),
    activitiesId: uuid('activities_id').references(() => activities.id),
    overheadsId: uuid('overheads_id').references(() => overheads.id),

    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(), // DateOfClaim
    periodStart: timestamp('period_start', { withTimezone: true }), // PeriodClaimStartDate
    periodEnd: timestamp('period_end', { withTimezone: true }), // PeriodClaimEndDate

    // VAT breakdown (Access CostExVAT / VAT% / VATAmount / TotalAmount).
    costExVat: doublePrecision('cost_ex_vat'),
    vatRate: doublePrecision('vat_rate'), // percentage, e.g. 15
    vatAmount: doublePrecision('vat_amount'),
    amount: doublePrecision('amount').notNull(), // TotalAmount (VAT-inclusive)
    currency: text('currency').notNull().default('ZAR'),

    description: text('description'), // ListTextItems
    receiptPath: text('receipt_path'), // reference/link to the receipt (Access FIles attachment)
    status: text('status').notNull().default('draft'), // draft|submitted|approved|rejected|reimbursed

    // Single manager approval (Access MangerApproval / ApprovedBy / SignedOn).
    managerId: uuid('manager_id'),
    managerDecidedAt: timestamp('manager_decided_at', { withTimezone: true }),
    managerStatus: text('manager_status').notNull().default('pending'), // pending|approved|rejected
    approvedBy: text('approved_by'), // Access ApprovedBy (free-text signatory)
    signedOn: timestamp('signed_on', { withTimezone: true }), // Access SignedOn
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
