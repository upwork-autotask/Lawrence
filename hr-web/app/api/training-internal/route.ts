import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listInternal } from '@/lib/services/training';
import { TrainingInternalCreate, TrainingInternalListQuery } from '@/lib/api/contracts/training';
import { trainingInternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: TrainingInternalListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listInternal(ctx, input),
});

export const POST = withHandler({
  schema: TrainingInternalCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, trainingInternal, 'training_internal', input),
});
