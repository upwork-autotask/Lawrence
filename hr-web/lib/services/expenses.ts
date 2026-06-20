import { desc, eq, type SQL } from 'drizzle-orm';
import { expenses, carScheme } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listExpenses(
  ctx: Ctx,
  input: { status?: string; employeeId?: string; q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(expenses.status, input.status));
  if (input.employeeId) where.push(eq(expenses.employeeId, input.employeeId));
  const { items, total } = await crudList(ctx.tx, expenses, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(expenses.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listCarScheme(
  ctx: Ctx,
  input: { employeeId?: string; q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(carScheme.employeeId, input.employeeId));
  const { items, total } = await crudList(ctx.tx, carScheme, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(carScheme.createdAt),
  });
  return { items, total, page, pageSize };
}
