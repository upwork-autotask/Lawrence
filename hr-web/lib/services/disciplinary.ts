import { desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { disciplinaryCases } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listCases(
  ctx: Ctx,
  input: { q?: string; status?: string; employeeId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(disciplinaryCases.status, input.status));
  if (input.employeeId) where.push(eq(disciplinaryCases.employeeId, input.employeeId));
  if (input.q) {
    const like = `%${input.q}%`;
    where.push(
      or(
        ilike(disciplinaryCases.caseNumber, like),
        ilike(disciplinaryCases.description, like),
      ) as SQL,
    );
  }
  const { items, total } = await crudList(ctx.tx, disciplinaryCases, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(disciplinaryCases.createdAt),
  });
  return { items, total, page, pageSize };
}
