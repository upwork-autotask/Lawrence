import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listJdKpis } from '@/lib/services/job-descriptions';
import { JdKpiCreate, JdChildListQuery } from '@/lib/api/contracts/job-descriptions';
import { jdKpis } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdChildListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJdKpis(ctx, input),
});

export const POST = withHandler({
  schema: JdKpiCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, jdKpis, 'jd_kpi', input),
});
