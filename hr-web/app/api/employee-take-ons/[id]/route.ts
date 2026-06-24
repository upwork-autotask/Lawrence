import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { TakeOnUpdate } from '@/lib/api/contracts/take-ons';
import { employeeTakeOns } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.EmployeeRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeeTakeOns, ctx.params.id),
});

export const PATCH = withHandler({
  schema: TakeOnUpdate,
  permission: Permissions.EmployeeWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    const patch = values.status === 'submitted'
      ? { ...values, submittedAt: new Date() }
      : values;
    return crudUpdate(ctx, employeeTakeOns, 'employee_take_on', ctx.params.id, patch, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.EmployeeWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeeTakeOns, 'employee_take_on', ctx.params.id),
});
