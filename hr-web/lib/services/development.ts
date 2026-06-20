import { asc, desc, eq, type SQL } from 'drizzle-orm';
import { developmentPlans, qualDev, skillsDev, devExperience } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listPlans(
  ctx: Ctx,
  input: { employeeId?: string; status?: string; q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(developmentPlans.employeeId, input.employeeId));
  if (input.status) where.push(eq(developmentPlans.status, input.status));
  const { items, total } = await crudList(ctx.tx, developmentPlans, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(developmentPlans.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listQuals(
  ctx: Ctx,
  input: { planId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.planId) where.push(eq(qualDev.planId, input.planId));
  const { items, total } = await crudList(ctx.tx, qualDev, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(qualDev.sortOrder),
  });
  return { items, total, page, pageSize };
}

export async function listSkills(
  ctx: Ctx,
  input: { planId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.planId) where.push(eq(skillsDev.planId, input.planId));
  const { items, total } = await crudList(ctx.tx, skillsDev, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(skillsDev.sortOrder),
  });
  return { items, total, page, pageSize };
}

export async function listDevExp(
  ctx: Ctx,
  input: { planId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.planId) where.push(eq(devExperience.planId, input.planId));
  const { items, total } = await crudList(ctx.tx, devExperience, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(devExperience.sortOrder),
  });
  return { items, total, page, pageSize };
}
