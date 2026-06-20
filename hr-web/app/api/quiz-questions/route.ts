import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { QuizQuestionCreate, QuizQuestionListQuery } from '@/lib/api/contracts/training';
import { quizQuestions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: QuizQuestionListQuery,
  permission: Permissions.TrainingRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: SQL[] = [];
    if (input.trainingId) where.push(eq(quizQuestions.trainingId, input.trainingId));
    const { items, total } = await crudList(ctx.tx, quizQuestions, {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(quizQuestions.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: QuizQuestionCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, quizQuestions, 'quiz_question', input),
});
