import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listJdTrainingInternal } from '@/lib/services/job-descriptions';
import { JdTrainingCreate, JdChildListQuery } from '@/lib/api/contracts/job-descriptions';
import { jdTrainingInternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdChildListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJdTrainingInternal(ctx, input),
});

export const POST = withHandler({
  schema: JdTrainingCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, jdTrainingInternal, 'jd_training_internal', input),
});
