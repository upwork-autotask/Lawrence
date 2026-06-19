import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { LeaveTypeCreate } from '@/lib/api/contracts/leave';
import { ListQuery } from '@/lib/api/contracts/common';
import { leaveTypes } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ListQuery,
  permission: Permissions.LeaveReadAll,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const { items, total } = await crudList(ctx.tx, leaveTypes, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: asc(leaveTypes.name),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: LeaveTypeCreate,
  permission: Permissions.LeaveWrite,
  handler: (input, ctx) => crudCreate(ctx, leaveTypes, 'leave_type', input),
});
