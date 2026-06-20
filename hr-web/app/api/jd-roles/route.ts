import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listJdRoles } from '@/lib/services/job-descriptions';
import { JdRoleCreate, JdRoleListQuery } from '@/lib/api/contracts/job-descriptions';
import { jdRoles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdRoleListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJdRoles(ctx, input),
});

export const POST = withHandler({
  schema: JdRoleCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, jdRoles, 'jd_role', input),
});
