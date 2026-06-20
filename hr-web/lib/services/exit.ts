import { desc, eq, type SQL } from 'drizzle-orm';
import { exitRecords } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listExits(
  ctx: Ctx,
  input: { status?: string; exitType?: string; q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(exitRecords.status, input.status));
  if (input.exitType) where.push(eq(exitRecords.exitType, input.exitType));
  const { items, total } = await crudList(ctx.tx, exitRecords, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(exitRecords.createdAt),
  });
  return { items, total, page, pageSize };
}
