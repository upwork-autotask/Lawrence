import { and, desc, eq, gte, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { leaveForms } from '../db/schema';
import { crudList, crudGet } from '../api/crud';
import { Errors } from '../api/errors';
import type { Ctx } from '../api/handler';

export async function listLeave(
  ctx: Ctx,
  input: {
    status?: string;
    employeeId?: string;
    regionId?: string;
    departmentId?: string;
    leaveTypeId?: string;
    from?: Date;
    to?: Date;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(leaveForms.status, input.status));
  if (input.employeeId) where.push(eq(leaveForms.employeeId, input.employeeId));
  if (input.regionId) where.push(eq(leaveForms.regionId, input.regionId));
  if (input.departmentId) where.push(eq(leaveForms.departmentId, input.departmentId));
  if (input.leaveTypeId) where.push(eq(leaveForms.leaveTypeId, input.leaveTypeId));
  if (input.from) where.push(gte(leaveForms.startDate, input.from));
  if (input.to) where.push(lte(leaveForms.startDate, input.to));
  if (input.q) {
    where.push(sql`(${leaveForms.reason} ilike ${'%' + input.q + '%'})`);
  }
  const { items, total } = await crudList(ctx.tx, leaveForms, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(leaveForms.createdAt),
  });
  // Sum daysRequested across the whole filtered set (not just the page) for the footer.
  const [{ sum }] = await (ctx.tx as never as {
    select: (s: unknown) => {
      from: (t: unknown) => { where: (c: SQL | undefined) => Promise<{ sum: number }[]> };
    };
  })
    .select({ sum: sql<number>`coalesce(sum(${leaveForms.daysRequested}), 0)::float` })
    .from(leaveForms)
    .where(and(isNull(leaveForms.deletedAt), ...where));
  return { items, total, totalDays: Math.round((sum ?? 0) * 100) / 100, page, pageSize };
}

/**
 * Apply a line-manager or HR decision to a leave form. Sets the step's status +
 * decided timestamp, recomputes the overall status, writes an audit row, and
 * guards against lost updates with an optional optimistic-lock token.
 */
export async function approveLeave(
  ctx: Ctx,
  id: string,
  step: 'lineManager' | 'hr',
  decision: 'approved' | 'rejected',
  comments?: string | null,
  expectedUpdatedAt?: string | null,
) {
  const before = await crudGet(ctx.tx, leaveForms, id);
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== before.updatedAt.getTime()) {
    throw Errors.conflict();
  }

  const now = new Date();
  const set: Record<string, unknown> = { updatedBy: ctx.actor?.id ?? null, updatedAt: now };
  // Note: lineManagerId/hrId reference employees, not users; the actor here is a
  // user, so we record the decision/status/comments and leave the FK columns null.
  if (step === 'lineManager') {
    set.lineManagerStatus = decision;
    set.lineManagerDecidedAt = now;
    set.lineManagerComments = comments ?? null;
  } else {
    set.hrStatus = decision;
    set.hrDecidedAt = now;
    set.hrComments = comments ?? null;
  }

  // Overall status: any rejection rejects; HR approval finalises; otherwise submitted.
  const lineManagerStatus = step === 'lineManager' ? decision : before.lineManagerStatus;
  const hrStatus = step === 'hr' ? decision : before.hrStatus;
  if (lineManagerStatus === 'rejected' || hrStatus === 'rejected') {
    set.status = 'rejected';
  } else if (hrStatus === 'approved') {
    set.status = 'approved';
  } else {
    set.status = 'submitted';
  }

  const [row] = await (ctx.tx as any)
    .update(leaveForms)
    .set(set)
    .where(eq(leaveForms.id, id))
    .returning();

  await ctx.audit({ action: 'approve', entityType: 'leave_form', entityId: id, before, after: row });
  return row;
}
