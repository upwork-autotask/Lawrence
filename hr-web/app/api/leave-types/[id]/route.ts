import { withHandler } from '@/lib/api/handler';
import { crudGet, crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { LeaveTypeUpdate } from '@/lib/api/contracts/leave';
import { leaveTypes } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.LeaveReadAll,
  handler: (_input, ctx) => crudGet(ctx.tx, leaveTypes, ctx.params.id),
});

export const PATCH = withHandler({
  schema: LeaveTypeUpdate,
  permission: Permissions.LeaveWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, leaveTypes, 'leave_type', ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.LeaveWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, leaveTypes, 'leave_type', ctx.params.id),
});
