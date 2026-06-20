import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CriticalSkillUpdate } from '@/lib/api/contracts/succession';
import { criticalSkills } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, criticalSkills, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CriticalSkillUpdate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, criticalSkills, 'critical_skill', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.SuccessionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, criticalSkills, 'critical_skill', ctx.params.id),
});
