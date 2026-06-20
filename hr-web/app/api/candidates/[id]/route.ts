import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CandidateUpdate } from '@/lib/api/contracts/recruitment';
import { candidates } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, candidates, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CandidateUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, candidates, 'candidate', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, candidates, 'candidate', ctx.params.id),
});
