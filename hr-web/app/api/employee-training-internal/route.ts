import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listEmployeeTrainingInternal } from '@/lib/services/employee-training';
import { EmployeeTrainingInternalCreate, EmployeeTrainingInternalListQuery } from '@/lib/api/contracts/employee-training';
import { employeeTrainingInternal } from '@/lib/db/schema/employee-training';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EmployeeTrainingInternalListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listEmployeeTrainingInternal(ctx, input),
});

export const POST = withHandler({
  schema: EmployeeTrainingInternalCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, employeeTrainingInternal, 'employee_training_internal', input),
});
