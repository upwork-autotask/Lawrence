import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listEmployees } from '@/lib/services/employees';
import { EmployeeCreate, EmployeeListQuery } from '@/lib/api/contracts/employees';
import { employees } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EmployeeListQuery,
  permission: Permissions.EmployeeRead,
  handler: (input, ctx) => listEmployees(ctx, input),
});

export const POST = withHandler({
  schema: EmployeeCreate,
  permission: Permissions.EmployeeWrite,
  handler: (input, ctx) => crudCreate(ctx, employees, 'employee', input),
});
