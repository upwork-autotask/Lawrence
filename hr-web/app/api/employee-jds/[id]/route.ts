import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { EmployeeJdUpdate } from '@/lib/api/contracts/job-descriptions';
import { employeeJds } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.JobDescriptionRead,
  handler: (_input, ctx) => crudGet(ctx.tx, employeeJds, ctx.params.id),
});

export const PATCH = withHandler({
  schema: EmployeeJdUpdate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, employeeJds, 'employee_jd', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.JobDescriptionWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, employeeJds, 'employee_jd', ctx.params.id),
});
