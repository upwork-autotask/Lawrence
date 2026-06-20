import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { JdTrainingUpdate } from '@/lib/api/contracts/job-descriptions';
import { jdTrainingExternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.JobDescriptionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, jdTrainingExternal, ctx.params.id),
});

export const PATCH = withHandler({
  schema: JdTrainingUpdate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, jdTrainingExternal, 'jd_training_external', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.JobDescriptionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, jdTrainingExternal, 'jd_training_external', ctx.params.id),
});
