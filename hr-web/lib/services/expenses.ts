import { and, desc, eq, gte, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { expenses, carScheme } from '../db/schema';
import { crudList, crudCreate, crudUpdate, crudGet } from '../api/crud';
import { Errors } from '../api/errors';
import type { Ctx } from '../api/handler';

/** Round to 2 decimals (currency). */
const money = (n: number) => Math.round(n * 100) / 100;

/**
 * Derive the VAT breakdown the way Access did: when a cost-ex-VAT figure is
 * supplied, vatAmount = costExVat × vatRate/100 and amount (TotalAmount) is the
 * VAT-inclusive sum. A caller may instead pass `amount` directly (no costExVat).
 */
export function computeAmounts(v: {
  costExVat?: number | null;
  vatRate?: number | null;
  amount?: number | null;
}): { costExVat: number | null; vatRate: number | null; vatAmount: number | null; amount: number } {
  if (v.costExVat != null) {
    const rate = v.vatRate ?? 0;
    const vatAmount = money(v.costExVat * (rate / 100));
    return { costExVat: money(v.costExVat), vatRate: rate, vatAmount, amount: money(v.costExVat + vatAmount) };
  }
  return { costExVat: null, vatRate: v.vatRate ?? null, vatAmount: null, amount: money(v.amount ?? 0) };
}

export async function createExpense(ctx: Ctx, input: Record<string, unknown>) {
  const { costExVat, vatRate, vatAmount, amount } = computeAmounts(input as never);
  return crudCreate(ctx, expenses, 'expense', { ...input, costExVat, vatRate, vatAmount, amount });
}

export async function updateExpense(
  ctx: Ctx,
  id: string,
  values: Record<string, unknown>,
  expectedUpdatedAt?: string | null,
) {
  // Recompute VAT/total only when any money field is part of the patch.
  let patch = values;
  if ('costExVat' in values || 'vatRate' in values || 'amount' in values) {
    const before = await crudGet(ctx.tx, expenses, id);
    const merged = {
      costExVat: 'costExVat' in values ? (values.costExVat as number | null) : before.costExVat,
      vatRate: 'vatRate' in values ? (values.vatRate as number | null) : before.vatRate,
      amount: 'amount' in values ? (values.amount as number | null) : before.amount,
    };
    patch = { ...values, ...computeAmounts(merged) };
  }
  return crudUpdate(ctx, expenses, 'expense', id, patch, expectedUpdatedAt);
}

/** Single manager approval (Access frmClaimApproval). */
export async function approveExpense(
  ctx: Ctx,
  id: string,
  input: { decision: 'approved' | 'rejected'; approvedBy?: unknown; expectedUpdatedAt?: string | null },
) {
  const before = await crudGet(ctx.tx, expenses, id);
  if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).getTime() !== before.updatedAt.getTime()) {
    throw Errors.conflict();
  }
  const now = new Date();
  const approved = input.decision === 'approved';
  const approvedBy = typeof input.approvedBy === 'string' && input.approvedBy ? input.approvedBy : ctx.actor?.fullName ?? null;
  return crudUpdate(ctx, expenses, 'expense', id, {
    managerStatus: input.decision,
    managerId: ctx.actor?.id ?? null,
    managerDecidedAt: now,
    approvedBy,
    signedOn: approved ? now : null,
    status: approved ? 'approved' : 'rejected',
  });
}

export async function listExpenses(
  ctx: Ctx,
  input: {
    status?: string;
    managerStatus?: string;
    employeeId?: string;
    regionId?: string;
    departmentId?: string;
    from?: Date;
    to?: Date;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(expenses.status, input.status));
  if (input.managerStatus) where.push(eq(expenses.managerStatus, input.managerStatus));
  if (input.employeeId) where.push(eq(expenses.employeeId, input.employeeId));
  if (input.regionId) where.push(eq(expenses.regionId, input.regionId));
  if (input.departmentId) where.push(eq(expenses.departmentId, input.departmentId));
  if (input.from) where.push(gte(expenses.expenseDate, input.from));
  if (input.to) where.push(lte(expenses.expenseDate, input.to));
  if (input.q) {
    where.push(sql`(${expenses.claimNumber} ilike ${'%' + input.q + '%'} or ${expenses.description} ilike ${'%' + input.q + '%'})`);
  }
  const { items, total } = await crudList(ctx.tx, expenses, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(expenses.expenseDate),
  });
  // Sum across the whole filtered set (not just the current page) for the footer.
  const [{ sum }] = await (ctx.tx as never as {
    select: (s: unknown) => {
      from: (t: unknown) => { where: (c: SQL | undefined) => Promise<{ sum: number }[]> };
    };
  })
    .select({ sum: sql<number>`coalesce(sum(${expenses.amount}), 0)::float` })
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), ...where));
  return { items, total, totalAmount: money(sum ?? 0), page, pageSize };
}

export async function listCarScheme(
  ctx: Ctx,
  input: {
    employeeId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(carScheme.employeeId, input.employeeId));
  if (input.status) where.push(eq(carScheme.status, input.status));
  if (input.from) where.push(gte(carScheme.cMonth, input.from));
  if (input.to) where.push(lte(carScheme.cMonth, input.to));
  const { items, total } = await crudList(ctx.tx, carScheme, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(carScheme.createdAt),
  });
  return { items, total, page, pageSize };
}
