import { asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { GradingCreate, GradingListQuery } from '@/lib/api/contracts/grading';
import { grading } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: GradingListQuery,
  permission: Permissions.LookupsRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 50;
    const where: SQL[] = [];
    if (input.patersonGrade) where.push(eq(grading.patersonGrade, input.patersonGrade));
    if (input.q) {
      const like = `%${input.q}%`;
      where.push(or(ilike(grading.jobTitle, like), ilike(grading.code, like), ilike(grading.patersonGrade, like)) as SQL);
    }
    const { items, total } = await crudList(ctx.tx, grading, {
      where, limit: pageSize, offset: (page - 1) * pageSize, orderBy: asc(grading.patersonGrade),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: GradingCreate,
  permission: Permissions.LookupsWrite,
  handler: (input, ctx) => crudCreate(ctx, grading, 'grading', input),
});
