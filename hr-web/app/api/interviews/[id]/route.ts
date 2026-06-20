import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { InterviewUpdate } from '@/lib/api/contracts/recruitment';
import { interviews } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, interviews, ctx.params.id),
});

export const PATCH = withHandler({
  schema: InterviewUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, interviews, 'interview', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, interviews, 'interview', ctx.params.id),
});
