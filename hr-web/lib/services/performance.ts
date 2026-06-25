import { desc, eq, sql, type SQL } from 'drizzle-orm';
import { employeePerformance, kpis } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listReviews(
  ctx: Ctx,
  input: {
    employeeId?: string;
    periodYear?: number;
    status?: string;
    kpiCategory?: string;
    achievementStatus?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(employeePerformance.employeeId, input.employeeId));
  if (input.periodYear) where.push(eq(employeePerformance.periodYear, input.periodYear));
  if (input.status) where.push(eq(employeePerformance.status, input.status));
  if (input.kpiCategory) where.push(eq(employeePerformance.kpiCategory, input.kpiCategory));
  if (input.achievementStatus) where.push(eq(employeePerformance.achievementStatus, input.achievementStatus));
  if (input.q) {
    where.push(
      sql`(${employeePerformance.title} ilike ${'%' + input.q + '%'} or ${employeePerformance.kpiCategory} ilike ${'%' + input.q + '%'} or ${employeePerformance.periodLabel} ilike ${'%' + input.q + '%'})`,
    );
  }
  const { items, total } = await crudList(ctx.tx, employeePerformance, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(employeePerformance.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listKpis(
  ctx: Ctx,
  input: { categoryId?: string; q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.categoryId) where.push(eq(kpis.categoryId, input.categoryId));
  const { items, total } = await crudList(ctx.tx, kpis, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(kpis.createdAt),
  });
  return { items, total, page, pageSize };
}
