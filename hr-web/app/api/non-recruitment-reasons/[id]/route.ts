import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { ReasonUpdate } from '@/lib/api/contracts/recruitment';
import { nonRecruitmentReasons } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, nonRecruitmentReasons, ctx.params.id),
});

export const PATCH = withHandler({
  schema: ReasonUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, nonRecruitmentReasons, 'non_recruitment_reason', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, nonRecruitmentReasons, 'non_recruitment_reason', ctx.params.id),
});
