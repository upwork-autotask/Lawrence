import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { TakeOnCreate, TakeOnListQuery } from '@/lib/api/contracts/take-ons';
import { employeeTakeOns } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: TakeOnListQuery,
  permission: Permissions.EmployeeRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: SQL[] = [];
    if (input.status) where.push(eq(employeeTakeOns.status, input.status));
    const { items, total } = await crudList(ctx.tx, employeeTakeOns, {
      where, limit: pageSize, offset: (page - 1) * pageSize, orderBy: desc(employeeTakeOns.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: TakeOnCreate,
  permission: Permissions.EmployeeWrite,
  handler: (input, ctx) =>
    crudCreate(ctx, employeeTakeOns, 'employee_take_on', {
      ...input,
      submittedAt: input.status === 'submitted' ? new Date() : null,
    }),
});
