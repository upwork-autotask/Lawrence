import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { SchemeUpdate } from '@/lib/api/contracts/succession';
import { successionSchemes } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, successionSchemes, ctx.params.id),
});

export const PATCH = withHandler({
  schema: SchemeUpdate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, successionSchemes, 'succession_scheme', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.SuccessionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, successionSchemes, 'succession_scheme', ctx.params.id),
});
