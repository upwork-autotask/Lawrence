import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { KpiUpdate } from '@/lib/api/contracts/performance';
import { kpis } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.PerformanceRead,
  handler: (_input, ctx) => crudGet(ctx.tx, kpis, ctx.params.id),
});

export const PATCH = withHandler({
  schema: KpiUpdate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, kpis, 'kpi', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.PerformanceWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, kpis, 'kpi', ctx.params.id),
});
