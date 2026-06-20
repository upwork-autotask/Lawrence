import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listJds } from '@/lib/services/job-descriptions';
import { JdCreate, JdListQuery } from '@/lib/api/contracts/job-descriptions';
import { jobDescriptions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJds(ctx, input),
});

export const POST = withHandler({
  schema: JdCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, jobDescriptions, 'job_description', input),
});
