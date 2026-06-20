import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { DevExpUpdate } from '@/lib/api/contracts/development';
import { devExperience } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DevelopmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, devExperience, ctx.params.id),
});

export const PATCH = withHandler({
  schema: DevExpUpdate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, devExperience, 'dev_experience', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DevelopmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, devExperience, 'dev_experience', ctx.params.id),
});
