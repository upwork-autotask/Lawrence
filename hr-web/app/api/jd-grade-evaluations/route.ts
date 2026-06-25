import { withHandler } from '@/lib/api/handler';
import { listJdGradeEvals, createJdGradeEval } from '@/lib/services/jd-grade-eval';
import { JdGradeEvalCreate, JdGradeEvalListQuery } from '@/lib/api/contracts/jd-grade-eval';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdGradeEvalListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJdGradeEvals(ctx, input),
});

export const POST = withHandler({
  schema: JdGradeEvalCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => createJdGradeEval(ctx, input),
});
