import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { KpiCategoryCreate } from '@/lib/api/contracts/performance';
import { ListQuery } from '@/lib/api/contracts/common';
import { kpiCategories } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { asc } from 'drizzle-orm';

export const GET = withHandler({
  schema: ListQuery,
  permission: Permissions.PerformanceRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const { items, total } = await crudList(ctx.tx, kpiCategories, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: asc(kpiCategories.sortOrder),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: KpiCategoryCreate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => crudCreate(ctx, kpiCategories, 'kpi_category', input),
});
