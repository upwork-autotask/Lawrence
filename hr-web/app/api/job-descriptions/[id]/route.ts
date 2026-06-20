import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { JdUpdate } from '@/lib/api/contracts/job-descriptions';
import { jobDescriptions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.JobDescriptionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, jobDescriptions, ctx.params.id),
});

export const PATCH = withHandler({
  schema: JdUpdate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, jobDescriptions, 'job_description', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.JobDescriptionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, jobDescriptions, 'job_description', ctx.params.id),
});
