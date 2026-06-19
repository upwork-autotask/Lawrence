import { withHandler } from '@/lib/api/handler';
import { approveLeave } from '@/lib/services/leave';
import { LeaveApprove } from '@/lib/api/contracts/leave';
import { Permissions } from '@/lib/auth/permissions';

export const POST = withHandler({
  schema: LeaveApprove,
  permission: Permissions.LeaveApproveAll,
  handler: (input, ctx) =>
    approveLeave(ctx, ctx.params.id, input.step, input.decision, (input.comments as string | null | undefined) ?? null),
});
