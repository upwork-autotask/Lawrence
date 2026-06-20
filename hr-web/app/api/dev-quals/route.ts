import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listQuals } from '@/lib/services/development';
import { QualCreate, QualListQuery } from '@/lib/api/contracts/development';
import { qualDev } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: QualListQuery,
  permission: Permissions.DevelopmentRead,
  handler: (input, ctx) => listQuals(ctx, input),
});

export const POST = withHandler({
  schema: QualCreate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => crudCreate(ctx, qualDev, 'qual_dev', input),
});
