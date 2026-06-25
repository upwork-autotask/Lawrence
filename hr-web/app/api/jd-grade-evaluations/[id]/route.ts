import { withHandler } from '@/lib/api/handler';
import { crudGet, crudSoftDelete } from '@/lib/api/crud';
import { updateJdGradeEval } from '@/lib/services/jd-grade-eval';
import { JdGradeEvalUpdate } from '@/lib/api/contracts/jd-grade-eval';
import { jdGradeEvaluations } from '@/lib/db/schema/jd-grade-eval';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.JobDescriptionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, jdGradeEvaluations, ctx.params.id),
});

export const PATCH = withHandler({
  schema: JdGradeEvalUpdate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return updateJdGradeEval(ctx, ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.JobDescriptionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, jdGradeEvaluations, 'jd_grade_evaluation', ctx.params.id),
});
