import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCatalogue } from '@/lib/services/training';
import { TrainingCreate, TrainingListQuery } from '@/lib/api/contracts/training';
import { trainingsCatalogue } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: TrainingListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listCatalogue(ctx, input),
});

export const POST = withHandler({
  schema: TrainingCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, trainingsCatalogue, 'training', input),
});
