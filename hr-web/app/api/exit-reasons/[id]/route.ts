import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { ReasonUpdate } from '@/lib/api/contracts/exit';
import { exitReasons } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ExitRead,
  handler: (_input, ctx) => crudGet(ctx.tx, exitReasons, ctx.params.id),
});

export const PATCH = withHandler({
  schema: ReasonUpdate,
  permission: Permissions.ExitWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, exitReasons, 'exit_reason', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.ExitWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, exitReasons, 'exit_reason', ctx.params.id),
});
