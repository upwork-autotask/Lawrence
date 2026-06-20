import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listExpenses } from '@/lib/services/expenses';
import { ExpenseCreate, ExpenseListQuery } from '@/lib/api/contracts/expenses';
import { expenses } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ExpenseListQuery,
  permission: Permissions.ExpenseRead,
  handler: (input, ctx) => listExpenses(ctx, input),
});

export const POST = withHandler({
  schema: ExpenseCreate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => crudCreate(ctx, expenses, 'expense', input),
});
