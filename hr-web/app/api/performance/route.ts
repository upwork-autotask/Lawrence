import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listReviews } from '@/lib/services/performance';
import { PerformanceCreate, PerformanceListQuery } from '@/lib/api/contracts/performance';
import { employeePerformance } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: PerformanceListQuery,
  permission: Permissions.PerformanceRead,
  handler: (input, ctx) => listReviews(ctx, input),
});

export const POST = withHandler({
  schema: PerformanceCreate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => crudCreate(ctx, employeePerformance, 'performance_review', input),
});
