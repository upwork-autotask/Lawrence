import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listExternal } from '@/lib/services/training';
import { TrainingExternalCreate, TrainingExternalListQuery } from '@/lib/api/contracts/training';
import { trainingExternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: TrainingExternalListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listExternal(ctx, input),
});

export const POST = withHandler({
  schema: TrainingExternalCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, trainingExternal, 'training_external', input),
});
