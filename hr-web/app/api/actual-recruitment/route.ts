import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { ActualCreate, ActualListQuery } from '@/lib/api/contracts/ee';
import { actualRecruitment } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ActualListQuery,
  permission: Permissions.RecruitmentRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 200;
    const where: SQL[] = [];
    if (input.progressStatus) where.push(eq(actualRecruitment.progressStatus, input.progressStatus));
    const { items, total } = await crudList(ctx.tx, actualRecruitment, {
      where, limit: pageSize, offset: (page - 1) * pageSize, orderBy: desc(actualRecruitment.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: ActualCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, actualRecruitment, 'actual_recruitment', input),
});
