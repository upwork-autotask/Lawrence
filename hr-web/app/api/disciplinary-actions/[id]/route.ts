import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { ActionUpdate } from '@/lib/api/contracts/disciplinary';
import { disciplinaryActions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DisciplinaryRead,
  handler: (_input, ctx) => crudGet(ctx.tx, disciplinaryActions, ctx.params.id),
});

export const PATCH = withHandler({
  schema: ActionUpdate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, disciplinaryActions, 'disciplinary_action', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DisciplinaryWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, disciplinaryActions, 'disciplinary_action', ctx.params.id),
});
