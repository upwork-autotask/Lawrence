import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listKpis } from '@/lib/services/performance';
import { KpiCreate, KpiListQuery } from '@/lib/api/contracts/performance';
import { kpis } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: KpiListQuery,
  permission: Permissions.PerformanceRead,
  handler: (input, ctx) => listKpis(ctx, input),
});

export const POST = withHandler({
  schema: KpiCreate,
  permission: Permissions.PerformanceWrite,
  handler: (input, ctx) => crudCreate(ctx, kpis, 'kpi', input),
});
