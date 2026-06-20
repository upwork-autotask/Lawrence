import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CriticalRoleUpdate } from '@/lib/api/contracts/succession';
import { criticalRoles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, criticalRoles, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CriticalRoleUpdate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, criticalRoles, 'critical_role', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.SuccessionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, criticalRoles, 'critical_role', ctx.params.id),
});
