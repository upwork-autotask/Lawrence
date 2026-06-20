import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CandidateUpdate } from '@/lib/api/contracts/succession';
import { successionCandidates } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, successionCandidates, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CandidateUpdate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, successionCandidates, 'succession_candidate', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.SuccessionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, successionCandidates, 'succession_candidate', ctx.params.id),
});
