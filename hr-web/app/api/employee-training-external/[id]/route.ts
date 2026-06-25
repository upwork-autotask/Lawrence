import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EmployeeTrainingExternalUpdate } from '@/lib/api/contracts/employee-training';
import { employeeTrainingExternal } from '@/lib/db/schema/employee-training';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeeTrainingExternal, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EmployeeTrainingExternalUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employeeTrainingExternal, 'employee_training_external', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeeTrainingExternal, 'employee_training_external', ctx.params.id),
});
