import { withHandler } from '@/lib/api/handler';
import { listAttempts, startAttempt } from '@/lib/services/training';
import { QuizAttemptCreate, QuizAttemptListQuery } from '@/lib/api/contracts/training';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: QuizAttemptListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listAttempts(ctx, input),
});

export const POST = withHandler({
  schema: QuizAttemptCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => startAttempt(ctx, input),
});
