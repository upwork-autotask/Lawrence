import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCommitments } from '@/lib/services/succession';
import { CommitmentCreate } from '@/lib/api/contracts/succession';
import { successionCommitments } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => listCommitments(ctx, ctx.query.get('candidateId') ?? ''),
});

export const POST = withHandler({
  schema: CommitmentCreate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => crudCreate(ctx, successionCommitments, 'succession_commitment', input),
});
