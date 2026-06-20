import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { TrainingInternalUpdate } from '@/lib/api/contracts/training';
import { trainingInternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, trainingInternal, ctx.params.id),
});

export const PATCH = withHandler({
  schema: TrainingInternalUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, trainingInternal, 'training_internal', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, trainingInternal, 'training_internal', ctx.params.id),
});
