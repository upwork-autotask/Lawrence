import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { KpiCategoryUpdate } from '@/lib/api/contracts/performance';
import { kpiCategories } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.PerformanceRead,
  handler: (_input, ctx) => crudGet(ctx.tx, kpiCategories, ctx.params.id),
});

export const PATCH = withHandler({
  schema: KpiCategoryUpdate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, kpiCategories, 'kpi_category', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.PerformanceWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, kpiCategories, 'kpi_category', ctx.params.id),
});
