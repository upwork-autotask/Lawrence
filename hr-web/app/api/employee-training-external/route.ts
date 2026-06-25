import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listEmployeeTrainingExternal } from '@/lib/services/employee-training';
import { EmployeeTrainingExternalCreate, EmployeeTrainingExternalListQuery } from '@/lib/api/contracts/employee-training';
import { employeeTrainingExternal } from '@/lib/db/schema/employee-training';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EmployeeTrainingExternalListQuery,
  permission: Permissions.TrainingRead,
  handler: (input, ctx) => listEmployeeTrainingExternal(ctx, input),
});

export const POST = withHandler({
  schema: EmployeeTrainingExternalCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, employeeTrainingExternal, 'employee_training_external', input),
});
