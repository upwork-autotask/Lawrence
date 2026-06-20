import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { TrainingUpdate } from '@/lib/api/contracts/training';
import { trainingsCatalogue } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, trainingsCatalogue, ctx.params.id),
});

export const PATCH = withHandler({
  schema: TrainingUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, trainingsCatalogue, 'training', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, trainingsCatalogue, 'training', ctx.params.id),
});
