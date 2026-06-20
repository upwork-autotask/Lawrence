import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { RequestUpdate } from '@/lib/api/contracts/recruitment';
import { recruitmentRequests } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, recruitmentRequests, ctx.params.id),
});

export const PATCH = withHandler({
  schema: RequestUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, recruitmentRequests, 'recruitment_request', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, recruitmentRequests, 'recruitment_request', ctx.params.id),
});
