import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { JdRoleUpdate } from '@/lib/api/contracts/job-descriptions';
import { jdRoles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.JobDescriptionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, jdRoles, ctx.params.id),
});

export const PATCH = withHandler({
  schema: JdRoleUpdate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, jdRoles, 'jd_role', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.JobDescriptionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, jdRoles, 'jd_role', ctx.params.id),
});
