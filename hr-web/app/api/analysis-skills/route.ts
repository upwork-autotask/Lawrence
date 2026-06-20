import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { AnalysisSkillCreate, AnalysisSkillListQuery } from '@/lib/api/contracts/training';
import { analysisSkills } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: AnalysisSkillListQuery,
  permission: Permissions.TrainingRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: SQL[] = [];
    if (input.employeeId) where.push(eq(analysisSkills.employeeId, input.employeeId));
    const { items, total } = await crudList(ctx.tx, analysisSkills, {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(analysisSkills.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: AnalysisSkillCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, analysisSkills, 'analysis_skill', input),
});
