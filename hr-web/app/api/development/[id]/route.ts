import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { PlanUpdate } from '@/lib/api/contracts/development';
import { developmentPlans } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DevelopmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, developmentPlans, ctx.params.id),
});

export const PATCH = withHandler({
  schema: PlanUpdate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, developmentPlans, 'development_plan', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DevelopmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, developmentPlans, 'development_plan', ctx.params.id),
});
