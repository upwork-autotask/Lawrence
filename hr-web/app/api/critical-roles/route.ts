import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCriticalRoles } from '@/lib/services/succession';
import { CriticalRoleCreate, CriticalRoleListQuery } from '@/lib/api/contracts/succession';
import { criticalRoles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: CriticalRoleListQuery,
  permission: Permissions.SuccessionRead,
  handler: (input, ctx) => listCriticalRoles(ctx, input),
});

export const POST = withHandler({
  schema: CriticalRoleCreate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => crudCreate(ctx, criticalRoles, 'critical_role', input),
});
