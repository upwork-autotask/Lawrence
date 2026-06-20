import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CategoryUpdate } from '@/lib/api/contracts/expenses';
import { expenseCategories } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ExpenseRead,
  handler: (_input, ctx) => crudGet(ctx.tx, expenseCategories, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CategoryUpdate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, expenseCategories, 'expense_category', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.ExpenseWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, expenseCategories, 'expense_category', ctx.params.id),
});
