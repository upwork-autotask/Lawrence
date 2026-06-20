import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCandidates } from '@/lib/services/succession';
import { CandidateCreate } from '@/lib/api/contracts/succession';
import { successionCandidates } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => listCandidates(ctx, ctx.query.get('criticalRoleId') ?? ''),
});

export const POST = withHandler({
  schema: CandidateCreate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => crudCreate(ctx, successionCandidates, 'succession_candidate', input),
});
