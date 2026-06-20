import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { CarSchemeUpdate } from '@/lib/api/contracts/expenses';
import { carScheme } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ExpenseRead,
  handler: (_input, ctx) => crudGet(ctx.tx, carScheme, ctx.params.id),
});

export const PATCH = withHandler({
  schema: CarSchemeUpdate,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, carScheme, 'car_scheme', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.ExpenseWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, carScheme, 'car_scheme', ctx.params.id),
});
