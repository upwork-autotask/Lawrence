import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listLeave } from '@/lib/services/leave';
import { LeaveFormCreate, LeaveListQuery } from '@/lib/api/contracts/leave';
import { leaveForms } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: LeaveListQuery,
  permission: Permissions.LeaveReadAll,
  handler: (input, ctx) => listLeave(ctx, input),
});

export const POST = withHandler({
  schema: LeaveFormCreate,
  permission: Permissions.LeaveWrite,
  handler: (input, ctx) => crudCreate(ctx, leaveForms, 'leave_form', input),
});
