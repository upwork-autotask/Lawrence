import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EmployeeTrainingInternalUpdate } from '@/lib/api/contracts/employee-training';
import { employeeTrainingInternal } from '@/lib/db/schema/employee-training';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.TrainingRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeeTrainingInternal, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EmployeeTrainingInternalUpdate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employeeTrainingInternal, 'employee_training_internal', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.TrainingWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeeTrainingInternal, 'employee_training_internal', ctx.params.id),
});
