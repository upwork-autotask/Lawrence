import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { CategoryCreate } from '@/lib/api/contracts/expenses';
import { ListQuery } from '@/lib/api/contracts/common';
import { expenseCategories } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ListQuery,
  permission: Permissions.ExpenseRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const { items, total } = await crudList(ctx.tx, expenseCategories, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: CategoryCreate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => crudCreate(ctx, expenseCategories, 'expense_category', input),
});
