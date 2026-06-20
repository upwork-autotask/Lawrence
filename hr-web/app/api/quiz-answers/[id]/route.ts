import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { QuizAnswerUpdate } from '@/lib/api/contracts/training';
import { quizAnswers } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, quizAnswers, ctx.params.id),
});

export const PATCH = withHandler({
  schema: QuizAnswerUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, quizAnswers, 'quiz_answer', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, quizAnswers, 'quiz_answer', ctx.params.id),
});
