import { withHandler } from '@/lib/api/handler';
import { approveExpense } from '@/lib/services/expenses';
import { ExpenseApprove } from '@/lib/api/contracts/expenses';
import { Permissions } from '@/lib/auth/permissions';

/** Manager approve/reject a claim (Access frmClaimApproval). */
export const POST = withHandler({
  schema: ExpenseApprove,
  permission: Permissions.ExpenseWrite,
  handler: (input, ctx) => approveExpense(ctx, ctx.params.id, input),
});
