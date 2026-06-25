import { withHandler } from '@/lib/api/handler';
import { listCandidateAssessments, createCandidateAssessment } from '@/lib/services/recruitment-assessment';
import { CandidateAssessmentCreate, CandidateAssessmentListQuery } from '@/lib/api/contracts/recruitment-assessment';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: CandidateAssessmentListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listCandidateAssessments(ctx, input),
});

export const POST = withHandler({
  schema: CandidateAssessmentCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => createCandidateAssessment(ctx, input),
});
