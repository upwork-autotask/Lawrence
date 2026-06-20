import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listPlans } from '@/lib/services/development';
import { PlanCreate, PlanListQuery } from '@/lib/api/contracts/development';
import { developmentPlans } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: PlanListQuery,
  permission: Permissions.DevelopmentRead,
  handler: (input, ctx) => listPlans(ctx, input),
});

export const POST = withHandler({
  schema: PlanCreate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => crudCreate(ctx, developmentPlans, 'development_plan', input),
});
