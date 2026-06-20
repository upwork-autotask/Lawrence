import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { trainingsCatalogue, trainingInternal, trainingExternal } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listCatalogue(
  ctx: Ctx,
  input: { q?: string; kind?: string; isActive?: boolean; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.kind) where.push(eq(trainingsCatalogue.kind, input.kind));
  if (input.isActive !== undefined) where.push(eq(trainingsCatalogue.isActive, input.isActive));
  if (input.q) {
    const like = `%${input.q}%`;
    where.push(
      or(
        ilike(trainingsCatalogue.name, like),
        ilike(trainingsCatalogue.code, like),
        ilike(trainingsCatalogue.provider, like),
      ) as SQL,
    );
  }
  const { items, total } = await crudList(ctx.tx, trainingsCatalogue, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingsCatalogue.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listInternal(
  ctx: Ctx,
  input: { employeeId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(trainingInternal.employeeId, input.employeeId));
  if (input.status) where.push(eq(trainingInternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, trainingInternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingInternal.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listExternal(
  ctx: Ctx,
  input: { employeeId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(trainingExternal.employeeId, input.employeeId));
  if (input.status) where.push(eq(trainingExternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, trainingExternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingExternal.createdAt),
  });
  return { items, total, page, pageSize };
}
