import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCandidates } from '@/lib/services/recruitment';
import { CandidateCreate, CandidateListQuery } from '@/lib/api/contracts/recruitment';
import { candidates } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: CandidateListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listCandidates(ctx, input),
});

export const POST = withHandler({
  schema: CandidateCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, candidates, 'candidate', input),
});
