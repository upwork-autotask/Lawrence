import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { TrainingExternalUpdate } from '@/lib/api/contracts/training';
import { trainingExternal } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, trainingExternal, ctx.params.id),
});

export const PATCH = withHandler({
  schema: TrainingExternalUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, trainingExternal, 'training_external', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, trainingExternal, 'training_external', ctx.params.id),
});
