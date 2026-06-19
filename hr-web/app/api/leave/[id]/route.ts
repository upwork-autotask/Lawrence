import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { LeaveFormUpdate } from '@/lib/api/contracts/leave';
import { leaveForms } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.LeaveReadAll,
  handler: (_input, ctx) => crudGet(ctx.tx, leaveForms, ctx.params.id),
});

export const PATCH = withHandler({
  schema: LeaveFormUpdate,
  permission: Permissions.LeaveWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, leaveForms, 'leave_form', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.LeaveWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, leaveForms, 'leave_form', ctx.params.id),
});
