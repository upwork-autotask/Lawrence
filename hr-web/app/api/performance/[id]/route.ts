import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { PerformanceUpdate } from '@/lib/api/contracts/performance';
import { employeePerformance } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.PerformanceRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeePerformance, ctx.params.id),
});

export const PATCH = withHandler({
  schema: PerformanceUpdate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employeePerformance, 'performance_review', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.PerformanceWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeePerformance, 'performance_review', ctx.params.id),
});
