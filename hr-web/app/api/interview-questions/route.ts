import { asc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { InterviewQuestionCreate, InterviewQuestionListQuery } from '@/lib/api/contracts/interview';
import { interviewQuestions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: InterviewQuestionListQuery,
  permission: Permissions.RecruitmentRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 200;
    const where: SQL[] = [];
    if (input.heading) where.push(eq(interviewQuestions.heading, input.heading));
    const { items, total } = await crudList(ctx.tx, interviewQuestions, {
      where, limit: pageSize, offset: (page - 1) * pageSize, orderBy: asc(interviewQuestions.sortOrder),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: InterviewQuestionCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, interviewQuestions, 'interview_question', input),
});
