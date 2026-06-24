import { withHandler } from '@/lib/api/handler';
import { hrDashboard } from '@/lib/services/dashboard';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.ReportsRun,
  handler: (_input, ctx) => hrDashboard(ctx),
});
