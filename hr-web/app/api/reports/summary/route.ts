import { withHandler } from '@/lib/api/handler';
import { summary } from '@/lib/services/reports';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ReportsRun,
  handler: (_input, ctx) => summary(ctx),
});
