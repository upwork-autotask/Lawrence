import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { OffenceUpdate } from '@/lib/api/contracts/disciplinary';
import { natureOfOffence } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DisciplinaryRead,
  handler: (_input, ctx) => crudGet(ctx.tx, natureOfOffence, ctx.params.id),
});

export const PATCH = withHandler({
  schema: OffenceUpdate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, natureOfOffence, 'offence', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DisciplinaryWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, natureOfOffence, 'offence', ctx.params.id),
});
