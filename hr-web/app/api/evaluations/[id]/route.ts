import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EvaluationUpdate } from '@/lib/api/contracts/recruitment';
import { evaluations } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, evaluations, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EvaluationUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, evaluations, 'evaluation', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, evaluations, 'evaluation', ctx.params.id),
});
