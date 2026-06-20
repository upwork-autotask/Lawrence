import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { QuizAnswerCreate, QuizAnswerListQuery } from '@/lib/api/contracts/training';
import { quizAnswers } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: QuizAnswerListQuery,
  permission: Permissions.TrainingRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: SQL[] = [];
    if (input.questionId) where.push(eq(quizAnswers.questionId, input.questionId));
    const { items, total } = await crudList(ctx.tx, quizAnswers, {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(quizAnswers.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: QuizAnswerCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, quizAnswers, 'quiz_answer', input),
});
