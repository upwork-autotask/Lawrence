import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import { employees, leaveTypes, leaveForms, leaveBalances } from '@shared/schema';
import { and, eq, sql, asc, desc, isNull } from 'drizzle-orm';
import type {
  LeaveFormValues, LeaveListRequest, LeaveRow,
  LeaveTypeFormValues, LeaveTypeRow,
  LeaveBalanceListRequest, LeaveBalanceRow,
  LeaveApproveRequest,
} from '@shared/ipc/leave';

/* ---------- Leave forms ---------- */

type LeaveListResult = { rows: LeaveRow[]; total: number };

export function listLeave(req: LeaveListRequest): LeaveListResult {
  const db = getDb();

  const conds = [isNull(leaveForms.deletedAt)];
  if (req.status) conds.push(eq(leaveForms.status, req.status));
  if (req.employeeId) conds.push(eq(leaveForms.employeeId, req.employeeId));
  if (req.leaveTypeId) conds.push(eq(leaveForms.leaveTypeId, req.leaveTypeId));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname})   LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(coalesce(${leaveForms.reason}, '')) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select({
      id: leaveForms.id,
      employeeId: leaveForms.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      leaveTypeId: leaveForms.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      startDate: leaveForms.startDate,
      endDate: leaveForms.endDate,
      daysRequested: leaveForms.daysRequested,
      reason: leaveForms.reason,
      attachmentPath: leaveForms.attachmentPath,
      status: leaveForms.status,
      lineManagerId: leaveForms.lineManagerId,
      lineManagerStatus: leaveForms.lineManagerStatus,
      lineManagerDecidedAt: leaveForms.lineManagerDecidedAt,
      lineManagerComments: leaveForms.lineManagerComments,
      hrId: leaveForms.hrId,
      hrStatus: leaveForms.hrStatus,
      hrDecidedAt: leaveForms.hrDecidedAt,
      hrComments: leaveForms.hrComments,
      emailStatus: leaveForms.emailStatus,
    })
    .from(leaveForms)
    .leftJoin(employees, eq(leaveForms.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveForms.leaveTypeId, leaveTypes.id))
    .where(where)
    .orderBy(desc(leaveForms.startDate))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(leaveForms)
    .leftJoin(employees, eq(leaveForms.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveForms.leaveTypeId, leaveTypes.id))
    .where(where)
    .get()?.c ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
      leaveTypeId: r.leaveTypeId,
      leaveTypeName: r.leaveTypeName ?? null,
      startDate: r.startDate.getTime(),
      endDate: r.endDate.getTime(),
      daysRequested: r.daysRequested,
      reason: r.reason ?? null,
      attachmentPath: r.attachmentPath ?? null,
      status: r.status,
      lineManagerId: r.lineManagerId ?? null,
      lineManagerStatus: r.lineManagerStatus,
      lineManagerDecidedAt: r.lineManagerDecidedAt ? r.lineManagerDecidedAt.getTime() : null,
      lineManagerComments: r.lineManagerComments ?? null,
      hrId: r.hrId ?? null,
      hrStatus: r.hrStatus,
      hrDecidedAt: r.hrDecidedAt ? r.hrDecidedAt.getTime() : null,
      hrComments: r.hrComments ?? null,
      emailStatus: r.emailStatus,
    })),
    total,
  };
}

export function getLeave(id: number): LeaveRow | null {
  const db = getDb();
  const r = db
    .select({
      id: leaveForms.id,
      employeeId: leaveForms.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      leaveTypeId: leaveForms.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      startDate: leaveForms.startDate,
      endDate: leaveForms.endDate,
      daysRequested: leaveForms.daysRequested,
      reason: leaveForms.reason,
      attachmentPath: leaveForms.attachmentPath,
      status: leaveForms.status,
      lineManagerId: leaveForms.lineManagerId,
      lineManagerStatus: leaveForms.lineManagerStatus,
      lineManagerDecidedAt: leaveForms.lineManagerDecidedAt,
      lineManagerComments: leaveForms.lineManagerComments,
      hrId: leaveForms.hrId,
      hrStatus: leaveForms.hrStatus,
      hrDecidedAt: leaveForms.hrDecidedAt,
      hrComments: leaveForms.hrComments,
      emailStatus: leaveForms.emailStatus,
      deletedAt: leaveForms.deletedAt,
    })
    .from(leaveForms)
    .leftJoin(employees, eq(leaveForms.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveForms.leaveTypeId, leaveTypes.id))
    .where(and(eq(leaveForms.id, id), isNull(leaveForms.deletedAt)))
    .get();
  if (!r) return null;
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    leaveTypeId: r.leaveTypeId,
    leaveTypeName: r.leaveTypeName ?? null,
    startDate: r.startDate.getTime(),
    endDate: r.endDate.getTime(),
    daysRequested: r.daysRequested,
    reason: r.reason ?? null,
    attachmentPath: r.attachmentPath ?? null,
    status: r.status,
    lineManagerId: r.lineManagerId ?? null,
    lineManagerStatus: r.lineManagerStatus,
    lineManagerDecidedAt: r.lineManagerDecidedAt ? r.lineManagerDecidedAt.getTime() : null,
    lineManagerComments: r.lineManagerComments ?? null,
    hrId: r.hrId ?? null,
    hrStatus: r.hrStatus,
    hrDecidedAt: r.hrDecidedAt ? r.hrDecidedAt.getTime() : null,
    hrComments: r.hrComments ?? null,
    emailStatus: r.emailStatus,
  };
}

function toLeaveInsertValues(v: LeaveFormValues, userId?: number) {
  return {
    employeeId: v.employeeId,
    leaveTypeId: v.leaveTypeId,
    startDate: v.startDate,
    endDate: v.endDate,
    daysRequested: v.daysRequested,
    reason: v.reason ?? null,
    attachmentPath: v.attachmentPath ?? null,
    status: v.status,
    lineManagerId: v.lineManagerId ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createLeave(values: LeaveFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(leaveForms).values(toLeaveInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'leave_forms', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateLeave(id: number, values: LeaveFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(leaveForms).where(eq(leaveForms.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toLeaveInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(leaveForms).set(next).where(eq(leaveForms.id, id)).run();
    const after = tx.select().from(leaveForms).where(eq(leaveForms.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'leave_forms', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteLeave(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(leaveForms).where(eq(leaveForms.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(leaveForms)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(leaveForms.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'leave_forms', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

export async function approveLeave(req: LeaveApproveRequest, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(leaveForms).where(eq(leaveForms.id, req.id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    const comments = req.comments ?? null;
    const decisionStatus = req.decision;

    // Decide overall record status based on which step decided.
    // - line_manager rejection => overall rejected.
    // - line_manager approval => overall stays submitted (awaiting HR) unless HR already approved.
    // - hr rejection => overall rejected.
    // - hr approval => overall approved.
    let nextStatus = before.status;
    const patch: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };

    if (req.step === 'line_manager') {
      patch.lineManagerId = userId;
      patch.lineManagerStatus = decisionStatus;
      patch.lineManagerDecidedAt = now;
      patch.lineManagerComments = comments;
      if (decisionStatus === 'rejected') {
        nextStatus = 'rejected';
      } else if (before.hrStatus === 'approved') {
        nextStatus = 'approved';
      } else if (before.status === 'draft') {
        nextStatus = 'submitted';
      }
    } else {
      patch.hrId = userId;
      patch.hrStatus = decisionStatus;
      patch.hrDecidedAt = now;
      patch.hrComments = comments;
      if (decisionStatus === 'rejected') {
        nextStatus = 'rejected';
      } else {
        nextStatus = 'approved';
      }
    }
    patch.status = nextStatus;

    tx.update(leaveForms).set(patch).where(eq(leaveForms.id, req.id)).run();
    const after = tx.select().from(leaveForms).where(eq(leaveForms.id, req.id)).get();
    return {
      result: null,
      envelope: {
        entity: 'leave_forms', entityId: req.id, op: 'update',
        payload: patch, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

/* ---------- Leave types ---------- */

export function listLeaveTypes(includeInactive: boolean): LeaveTypeRow[] {
  const db = getDb();
  const conds = [isNull(leaveTypes.deletedAt)];
  if (!includeInactive) conds.push(eq(leaveTypes.isActive, true));
  const rows = db
    .select()
    .from(leaveTypes)
    .where(and(...conds))
    .orderBy(asc(leaveTypes.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    isActive: r.isActive,
    defaultDays: r.defaultDays,
    requiresAttachment: r.requiresAttachment,
    accrualPerMonth: r.accrualPerMonth,
  }));
}

function toLeaveTypeInsertValues(v: LeaveTypeFormValues, userId?: number) {
  return {
    code: v.code ?? null,
    name: v.name,
    description: v.description ?? null,
    isActive: v.isActive,
    defaultDays: v.defaultDays,
    requiresAttachment: v.requiresAttachment,
    accrualPerMonth: v.accrualPerMonth,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createLeaveType(values: LeaveTypeFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(leaveTypes).values(toLeaveTypeInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'leave_types', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateLeaveType(id: number, values: LeaveTypeFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toLeaveTypeInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(leaveTypes).set(next).where(eq(leaveTypes.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'leave_types', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteLeaveType(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(leaveTypes)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(leaveTypes.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'leave_types', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Leave balances ---------- */

export function listLeaveBalances(req: LeaveBalanceListRequest): LeaveBalanceRow[] {
  const db = getDb();
  const conds = [isNull(leaveBalances.deletedAt)];
  if (req.employeeId) conds.push(eq(leaveBalances.employeeId, req.employeeId));
  if (req.leaveTypeId) conds.push(eq(leaveBalances.leaveTypeId, req.leaveTypeId));
  if (req.year !== undefined) conds.push(eq(leaveBalances.year, req.year));

  const rows = db
    .select({
      id: leaveBalances.id,
      employeeId: leaveBalances.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      leaveTypeId: leaveBalances.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      year: leaveBalances.year,
      allocated: leaveBalances.allocated,
      taken: leaveBalances.taken,
      pending: leaveBalances.pending,
    })
    .from(leaveBalances)
    .leftJoin(employees, eq(leaveBalances.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
    .where(and(...conds))
    .orderBy(desc(leaveBalances.year), asc(leaveTypes.name))
    .all();

  return rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    leaveTypeId: r.leaveTypeId,
    leaveTypeName: r.leaveTypeName ?? null,
    year: r.year,
    allocated: r.allocated,
    taken: r.taken,
    pending: r.pending,
  }));
}
