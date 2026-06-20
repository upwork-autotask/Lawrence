import { z } from 'zod';
import { withHandler } from '@/lib/api/handler';
import { listAudit } from '@/lib/services/audit';
import { ListQuery } from '@/lib/api/contracts/common';
import { Permissions } from '@/lib/auth/permissions';

const AuditListQuery = ListQuery.extend({
  entityType: z.string().optional(),
  action: z.string().optional(),
});

export const GET = withHandler({
  schema: AuditListQuery,
  permission: Permissions.AuditRead,
  handler: (input, ctx) => listAudit(ctx, input),
});
