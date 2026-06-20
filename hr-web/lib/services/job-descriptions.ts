import { asc, desc, eq, ilike, type SQL } from 'drizzle-orm';
import { jobDescriptions, jdEntries, jdRoles, employeeJds, jdKpis, jdTrainingInternal, jdTrainingExternal } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listJds(
  ctx: Ctx,
  input: { q?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(jobDescriptions.status, input.status));
  if (input.q) where.push(ilike(jobDescriptions.title, `%${input.q}%`));
  const { items, total } = await crudList(ctx.tx, jobDescriptions, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(jobDescriptions.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listJdEntries(
  ctx: Ctx,
  input: { jdId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.jdId) where.push(eq(jdEntries.jdId, input.jdId));
  const { items, total } = await crudList(ctx.tx, jdEntries, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(jdEntries.sortOrder),
  });
  return { items, total, page, pageSize };
}

export async function listJdRoles(
  ctx: Ctx,
  input: { jdId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.jdId) where.push(eq(jdRoles.jdId, input.jdId));
  const { items, total } = await crudList(ctx.tx, jdRoles, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(jdRoles.sortOrder),
  });
  return { items, total, page, pageSize };
}

export async function listEmployeeJds(
  ctx: Ctx,
  input: { employeeId?: string; jdId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(employeeJds.employeeId, input.employeeId));
  if (input.jdId) where.push(eq(employeeJds.jdId, input.jdId));
  if (input.status) where.push(eq(employeeJds.status, input.status));
  const { items, total } = await crudList(ctx.tx, employeeJds, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(employeeJds.createdAt),
  });
  return { items, total, page, pageSize };
}

/** Generic child-by-jdId lister for the KPI/training link tables. */
async function listByJd(
  ctx: Ctx,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jdCol: any,
  input: { jdId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.jdId) where.push(eq(jdCol, input.jdId));
  const { items, total } = await crudList(ctx.tx, table, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(table.sortOrder),
  });
  return { items, total, page, pageSize };
}

export const listJdKpis = (ctx: Ctx, input: { jdId?: string; page?: number; pageSize?: number }) =>
  listByJd(ctx, jdKpis, jdKpis.jdId, input);
export const listJdTrainingInternal = (ctx: Ctx, input: { jdId?: string; page?: number; pageSize?: number }) =>
  listByJd(ctx, jdTrainingInternal, jdTrainingInternal.jdId, input);
export const listJdTrainingExternal = (ctx: Ctx, input: { jdId?: string; page?: number; pageSize?: number }) =>
  listByJd(ctx, jdTrainingExternal, jdTrainingExternal.jdId, input);
