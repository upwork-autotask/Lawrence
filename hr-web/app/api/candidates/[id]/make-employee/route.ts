import { withHandler } from '@/lib/api/handler';
import { makeEmployeeFromCandidate } from '@/lib/services/recruitment-assessment';
import { MakeEmployee } from '@/lib/api/contracts/recruitment-assessment';
import { Permissions } from '@/lib/auth/permissions';

/**
 * Candidate → Employee conversion (Access "Make Employee" action). Gated on
 * EmployeeWrite — the privileged action here is creating an `employees` row; the
 * UI additionally requires RecruitmentWrite to surface the button. `withHandler`
 * permission arrays are OR-matched, so a single key keeps the gate strict.
 */
export const POST = withHandler({
  schema: MakeEmployee,
  permission: Permissions.EmployeeWrite,
  handler: (input, ctx) => makeEmployeeFromCandidate(ctx, ctx.params.id, input),
});
