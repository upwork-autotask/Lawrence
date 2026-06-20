import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CommitmentUpdate } from '@/lib/api/contracts/succession';
import { successionCommitments } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, successionCommitments, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CommitmentUpdate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, successionCommitments, 'succession_commitment', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.SuccessionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, successionCommitments, 'succession_commitment', ctx.params.id),
});
