import { withHandler } from '@/lib/api/handler';
import { listExpenses, createExpense } from '@/lib/services/expenses';
import { ExpenseCreate, ExpenseListQuery } from '@/lib/api/contracts/expenses';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ExpenseListQuery,
  permission: Permissions.ExpenseRead,
  handler: (input, ctx) => listExpenses(ctx, input),
});

export const POST = withHandler({
  schema: ExpenseCreate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => createExpense(ctx, input),
});
