import { withHandler } from '@/lib/api/handler';
import { crudGet, crudSoftDelete } from '@/lib/api/crud';
import { updateExpense } from '@/lib/services/expenses';
import { ExpenseUpdate } from '@/lib/api/contracts/expenses';
import { expenses } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ExpenseRead,
  handler: (_input, ctx) => crudGet(ctx.tx, expenses, ctx.params.id),
});

export const PATCH = withHandler({
  schema: ExpenseUpdate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return updateExpense(ctx, ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.ExpenseWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, expenses, 'expense', ctx.params.id),
});
