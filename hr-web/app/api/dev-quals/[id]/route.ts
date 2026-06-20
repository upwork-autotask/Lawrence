import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { QualUpdate } from '@/lib/api/contracts/development';
import { qualDev } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DevelopmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, qualDev, ctx.params.id),
});

export const PATCH = withHandler({
  schema: QualUpdate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, qualDev, 'qual_dev', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DevelopmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, qualDev, 'qual_dev', ctx.params.id),
});
