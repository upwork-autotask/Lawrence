import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { TargetCreate, TargetListQuery } from '@/lib/api/contracts/ee';
import { recruitmentTargets } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: TargetListQuery,
  permission: Permissions.RecruitmentRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 200;
    const where: SQL[] = [];
    if (input.periodYear) where.push(eq(recruitmentTargets.periodYear, input.periodYear));
    const { items, total } = await crudList(ctx.tx, recruitmentTargets, {
      where, limit: pageSize, offset: (page - 1) * pageSize, orderBy: desc(recruitmentTargets.periodYear),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: TargetCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, recruitmentTargets, 'recruitment_target', input),
});
