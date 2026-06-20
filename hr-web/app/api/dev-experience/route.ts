import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listDevExp } from '@/lib/services/development';
import { DevExpCreate, DevExpListQuery } from '@/lib/api/contracts/development';
import { devExperience } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: DevExpListQuery,
  permission: Permissions.DevelopmentRead,
  handler: (input, ctx) => listDevExp(ctx, input),
});

export const POST = withHandler({
  schema: DevExpCreate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => crudCreate(ctx, devExperience, 'dev_experience', input),
});
