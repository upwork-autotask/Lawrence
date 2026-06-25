import { z } from 'zod';
import { optStr, optUuid, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

export const ExpenseCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  categoryId: optUuid,
  // Org allocation
  regionId: optUuid,
  departmentId: optUuid,
  // Cost allocation
  depotId: optUuid,
  costOfSaleId: optUuid,
  activitiesId: optUuid,
  overheadsId: optUuid,
  merge: optStr,
  // Dates
  expenseDate: z.coerce.date({ required_error: 'Claim date is required', invalid_type_error: 'Claim date is required' }),
  periodStart: optDate,
  periodEnd: optDate,
  // VAT breakdown — amount (total) is computed server-side from costExVat + vatRate
  // when costExVat is supplied; a caller may also send amount directly.
  costExVat: optNum,
  vatRate: optNum,
  amount: optNum,
  // Per-category cost buckets
  accommodation: optNum,
  entertainment: optNum,
  international: optNum,
  sundry: optNum,
  currency: z.string().default('ZAR'),
  description: optStr,
  receiptPath: optStr, // reference/link to the receipt
  claimNumber: optStr,
  status: z.string().default('draft'),
});

export const ExpenseUpdate = ExpenseCreate.partial().extend({ expectedUpdatedAt });

/** Manager approval decision (Access frmClaimApproval). */
export const ExpenseApprove = z.object({
  decision: z.enum(['approved', 'rejected']),
  approvedBy: optStr,
  expectedUpdatedAt,
});

export const ExpenseListQuery = ListQuery.extend({
  status: z.string().optional(),
  managerStatus: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  from: z.coerce.date().optional(), // claim date range (register/history)
  to: z.coerce.date().optional(),
});

export const CategoryCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const CategoryUpdate = CategoryCreate.partial().extend({ expectedUpdatedAt });

export const CarSchemeCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  registration: optStr,
  makeModel: optStr,
  year: optStr,
  monthlyAllowance: optNum,
  startDate: optDate,
  endDate: optDate,
  status: z.string().default('active'),
  notes: optStr,
  // Monthly kilometre-reimbursement claim
  cMonth: optDate,
  kmStart: optNum,
  kmEnd: optNum,
  totalKm: optNum,
  bkm: optNum,
  pkm: optNum,
  ratePerKm: optNum,
  totalAmount: optNum,
  regionId: optUuid,
  departmentId: optUuid,
});

export const CarSchemeUpdate = CarSchemeCreate.partial().extend({ expectedUpdatedAt });

export const CarSchemeListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
});

export type ExpenseCreate = z.infer<typeof ExpenseCreate>;
export type ExpenseUpdate = z.infer<typeof ExpenseUpdate>;
export type ExpenseApprove = z.infer<typeof ExpenseApprove>;
export type CategoryCreate = z.infer<typeof CategoryCreate>;
export type CategoryUpdate = z.infer<typeof CategoryUpdate>;
export type CarSchemeCreate = z.infer<typeof CarSchemeCreate>;
export type CarSchemeUpdate = z.infer<typeof CarSchemeUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type ExpenseRow = {
  id: string;
  claimNumber: string | null;
  employeeId: string;
  categoryId: string | null;
  regionId: string | null;
  departmentId: string | null;
  depotId: string | null;
  costOfSaleId: string | null;
  activitiesId: string | null;
  overheadsId: string | null;
  merge: string | null;
  expenseDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  costExVat: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  amount: number;
  accommodation: number | null;
  entertainment: number | null;
  international: number | null;
  sundry: number | null;
  currency: string;
  description: string | null;
  receiptPath: string | null;
  status: string;
  managerStatus: string;
  managerDecidedAt: string | null;
  approvedBy: string | null;
  signedOn: string | null;
  financeStatus: string;
  financeDecidedAt: string | null;
  reimbursedAt: string | null;
  updatedAt: string;
};

/** List response for expenses; `totalAmount` sums the filtered set (register footer). */
export type ExpenseListResult = {
  items: ExpenseRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageSize: number;
};

export type CategoryRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type CarSchemeRow = {
  id: string;
  employeeId: string;
  registration: string | null;
  makeModel: string | null;
  year: string | null;
  monthlyAllowance: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string | null;
  cMonth: string | null;
  kmStart: number | null;
  kmEnd: number | null;
  totalKm: number | null;
  bkm: number | null;
  pkm: number | null;
  ratePerKm: number | null;
  totalAmount: number | null;
  regionId: string | null;
  departmentId: string | null;
  updatedAt: string;
};
