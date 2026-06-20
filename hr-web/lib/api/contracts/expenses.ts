import { z } from 'zod';
import { optStr, optUuid, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

export const ExpenseCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  categoryId: optUuid,
  expenseDate: z.coerce.date({ required_error: 'Expense date is required', invalid_type_error: 'Expense date is required' }),
  amount: z.coerce.number({ required_error: 'Amount is required', invalid_type_error: 'Amount is required' }),
  currency: z.string().default('ZAR'),
  description: optStr,
  status: z.string().default('draft'),
});

export const ExpenseUpdate = ExpenseCreate.partial().extend({ expectedUpdatedAt });

export const ExpenseListQuery = ListQuery.extend({
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
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
});

export const CarSchemeUpdate = CarSchemeCreate.partial().extend({ expectedUpdatedAt });

export const CarSchemeListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
});

export type ExpenseCreate = z.infer<typeof ExpenseCreate>;
export type ExpenseUpdate = z.infer<typeof ExpenseUpdate>;
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
  expenseDate: string;
  amount: number;
  currency: string;
  description: string | null;
  receiptPath: string | null;
  status: string;
  managerStatus: string;
  managerDecidedAt: string | null;
  financeStatus: string;
  financeDecidedAt: string | null;
  reimbursedAt: string | null;
  updatedAt: string;
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
  updatedAt: string;
};
