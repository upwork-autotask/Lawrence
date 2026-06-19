import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CaseUpdate } from '@/lib/api/contracts/disciplinary';
import { disciplinaryCases } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DisciplinaryRead,
  handler: (_input, ctx) => crudGet(ctx.tx, disciplinaryCases, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CaseUpdate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, disciplinaryCases, 'disciplinary_case', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DisciplinaryWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, disciplinaryCases, 'disciplinary_case', ctx.params.id),
});
