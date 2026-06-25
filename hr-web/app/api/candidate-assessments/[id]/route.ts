import { withHandler } from '@/lib/api/handler';
import { crudGet, crudSoftDelete } from '@/lib/api/crud';
import { updateCandidateAssessment } from '@/lib/services/recruitment-assessment';
import { CandidateAssessmentUpdate } from '@/lib/api/contracts/recruitment-assessment';
import { candidateAssessments } from '@/lib/db/schema/recruitment-assessment';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudGet(ctx.tx, candidateAssessments, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CandidateAssessmentUpdate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return updateCandidateAssessment(ctx, ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.RecruitmentWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, candidateAssessments, 'candidate_assessment', ctx.params.id),
});
