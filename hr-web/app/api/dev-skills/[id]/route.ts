import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { SkillUpdate } from '@/lib/api/contracts/development';
import { skillsDev } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.DevelopmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, skillsDev, ctx.params.id),
});

export const PATCH = withHandler({
  schema: SkillUpdate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, skillsDev, 'skills_dev', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.DevelopmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, skillsDev, 'skills_dev', ctx.params.id),
});
