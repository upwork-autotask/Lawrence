import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EmployeeUpdate } from '@/lib/api/contracts/employees';
import { employees } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.EmployeeRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employees, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EmployeeUpdate,
  permission: Permissions.EmployeeWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employees, 'employee', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.EmployeeDelete,
  handler: (_input, ctx) => crudSoftDelete(ctx, employees, 'employee', ctx.params.id),
});
