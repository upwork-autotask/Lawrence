import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCarScheme } from '@/lib/services/expenses';
import { CarSchemeCreate, CarSchemeListQuery } from '@/lib/api/contracts/expenses';
import { carScheme } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: CarSchemeListQuery,
  permission: Permissions.ExpenseRead,
  handler: (input, ctx) => listCarScheme(ctx, input),
});

export const POST = withHandler({
  schema: CarSchemeCreate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => crudCreate(ctx, carScheme, 'car_scheme', input),
});
