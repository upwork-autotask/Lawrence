import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { ExitUpdate } from '@/lib/api/contracts/exit';
import { exitRecords } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ExitRead,
  handler: (_input, ctx) => crudGet(ctx.tx, exitRecords, ctx.params.id),
});

export const PATCH = withHandler({
  schema: ExitUpdate,
  permission: Permissions.ExitWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, exitRecords, 'exit_record', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.ExitWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, exitRecords, 'exit_record', ctx.params.id),
});
