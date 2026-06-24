import { withHandler } from '@/lib/api/handler';
import { listInterviewScores, saveInterviewScores } from '@/lib/services/interview';
import { InterviewScoresSave } from '@/lib/api/contracts/interview';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => listInterviewScores(ctx, ctx.params.id),
});

/** Replace the whole scoring sheet for the interview. */
export const PUT = withHandler({
  schema: InterviewScoresSave,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => saveInterviewScores(ctx, ctx.params.id, input),
});
