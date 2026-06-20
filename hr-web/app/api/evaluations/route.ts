import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listEvaluations } from '@/lib/services/recruitment';
import { EvaluationCreate, EvaluationListQuery } from '@/lib/api/contracts/recruitment';
import { evaluations } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EvaluationListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listEvaluations(ctx, input),
});

export const POST = withHandler({
  schema: EvaluationCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, evaluations, 'evaluation', input),
});
