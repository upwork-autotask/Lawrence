import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listEmployeeJds } from '@/lib/services/job-descriptions';
import { EmployeeJdCreate, EmployeeJdListQuery } from '@/lib/api/contracts/job-descriptions';
import { employeeJds } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EmployeeJdListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listEmployeeJds(ctx, input),
});

export const POST = withHandler({
  schema: EmployeeJdCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, employeeJds, 'employee_jd', input),
});
