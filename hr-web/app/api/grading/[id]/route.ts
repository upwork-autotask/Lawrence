import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { GradingUpdate } from '@/lib/api/contracts/grading';
import { grading } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.LookupsRead,
  handler: (_input, ctx) => crudGet(ctx.tx, grading, ctx.params.id),
});

export const PATCH = withHandler({
  schema: GradingUpdate,
  permission: Permissions.LookupsWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, grading, 'grading', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.LookupsWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, grading, 'grading', ctx.params.id),
});
