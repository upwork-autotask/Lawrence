import { withHandler } from '@/lib/api/handler';
import { submitAttempt } from '@/lib/services/training';
import { QuizAttemptSubmit } from '@/lib/api/contracts/training';
import { Permissions } from '@/lib/auth/permissions';

/** Grade & finalise a sitting — sums selected-answer points (Access subfrmAns). */
export const POST = withHandler({
  schema: QuizAttemptSubmit,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => submitAttempt(ctx, ctx.params.id, input),
});
