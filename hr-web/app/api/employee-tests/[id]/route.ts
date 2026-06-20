import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EmployeeTestUpdate } from '@/lib/api/contracts/training';
import { employeeTests } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeeTests, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EmployeeTestUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employeeTests, 'employee_test', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeeTests, 'employee_test', ctx.params.id),
});
