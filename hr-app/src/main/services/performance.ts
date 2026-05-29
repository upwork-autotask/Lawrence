import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import { employees, kpiCategories, kpis, employeePerformance } from '@shared/schema';
import { and, eq, sql, asc, desc, isNull } from 'drizzle-orm';
import type {
  PerformanceFormValues, PerformanceListRequest, PerformanceRow,
  PerformanceApproveRequest,
  KpiCategoryFormValues, KpiCategoryRow,
  KpiFormValues, KpiListRequest, KpiRow,
} from '@shared/ipc/performance';

/* ---------- Employee performance ---------- */

type PerformanceListResult = { rows: PerformanceRow[]; total: number };

export function listPerformance(req: PerformanceListRequest): PerformanceListResult {
  const db = getDb();

  const conds = [isNull(employeePerformance.deletedAt)];
  if (req.status) conds.push(eq(employeePerformance.status, req.status));
  if (req.employeeId) conds.push(eq(employeePerformance.employeeId, req.employeeId));
  if (req.kpiId) conds.push(eq(employeePerformance.kpiId, req.kpiId));
  if (req.periodYear !== undefined) conds.push(eq(employeePerformance.periodYear, req.periodYear));
  if (req.periodQuarter !== undefined) {
    conds.push(eq(employeePerformance.periodQuarter, req.periodQuarter));
  }
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname})   LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(coalesce(${kpis.name}, '')) LIKE ${q} OR
      lower(coalesce(${employeePerformance.periodLabel}, '')) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select({
      id: employeePerformance.id,
      employeeId: employeePerformance.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      periodYear: employeePerformance.periodYear,
      periodQuarter: employeePerformance.periodQuarter,
      periodLabel: employeePerformance.periodLabel,
      kpiId: employeePerformance.kpiId,
      kpiName: kpis.name,
      categoryId: kpis.categoryId,
      categoryName: kpiCategories.name,
      targetValue: employeePerformance.targetValue,
      actualValue: employeePerformance.actualValue,
      score: employeePerformance.score,
      weight: employeePerformance.weight,
      managerComments: employeePerformance.managerComments,
      employeeComments: employeePerformance.employeeComments,
      status: employeePerformance.status,
      lineManagerId: employeePerformance.lineManagerId,
      lineManagerDecidedAt: employeePerformance.lineManagerDecidedAt,
      hrId: employeePerformance.hrId,
      hrDecidedAt: employeePerformance.hrDecidedAt,
      excoDecidedAt: employeePerformance.excoDecidedAt,
    })
    .from(employeePerformance)
    .leftJoin(employees, eq(employeePerformance.employeeId, employees.id))
    .leftJoin(kpis, eq(employeePerformance.kpiId, kpis.id))
    .leftJoin(kpiCategories, eq(kpis.categoryId, kpiCategories.id))
    .where(where)
    .orderBy(desc(employeePerformance.periodYear), desc(employeePerformance.periodQuarter))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(employeePerformance)
    .leftJoin(employees, eq(employeePerformance.employeeId, employees.id))
    .leftJoin(kpis, eq(employeePerformance.kpiId, kpis.id))
    .leftJoin(kpiCategories, eq(kpis.categoryId, kpiCategories.id))
    .where(where)
    .get()?.c ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
      periodYear: r.periodYear,
      periodQuarter: r.periodQuarter ?? null,
      periodLabel: r.periodLabel ?? null,
      kpiId: r.kpiId,
      kpiName: r.kpiName ?? null,
      categoryId: r.categoryId ?? null,
      categoryName: r.categoryName ?? null,
      targetValue: r.targetValue ?? null,
      actualValue: r.actualValue ?? null,
      score: r.score ?? null,
      weight: r.weight,
      managerComments: r.managerComments ?? null,
      employeeComments: r.employeeComments ?? null,
      status: r.status,
      lineManagerId: r.lineManagerId ?? null,
      lineManagerDecidedAt: r.lineManagerDecidedAt ? r.lineManagerDecidedAt.getTime() : null,
      hrId: r.hrId ?? null,
      hrDecidedAt: r.hrDecidedAt ? r.hrDecidedAt.getTime() : null,
      excoDecidedAt: r.excoDecidedAt ? r.excoDecidedAt.getTime() : null,
    })),
    total,
  };
}

export function getPerformance(id: number): PerformanceRow | null {
  const db = getDb();
  const r = db
    .select({
      id: employeePerformance.id,
      employeeId: employeePerformance.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      periodYear: employeePerformance.periodYear,
      periodQuarter: employeePerformance.periodQuarter,
      periodLabel: employeePerformance.periodLabel,
      kpiId: employeePerformance.kpiId,
      kpiName: kpis.name,
      categoryId: kpis.categoryId,
      categoryName: kpiCategories.name,
      targetValue: employeePerformance.targetValue,
      actualValue: employeePerformance.actualValue,
      score: employeePerformance.score,
      weight: employeePerformance.weight,
      managerComments: employeePerformance.managerComments,
      employeeComments: employeePerformance.employeeComments,
      status: employeePerformance.status,
      lineManagerId: employeePerformance.lineManagerId,
      lineManagerDecidedAt: employeePerformance.lineManagerDecidedAt,
      hrId: employeePerformance.hrId,
      hrDecidedAt: employeePerformance.hrDecidedAt,
      excoDecidedAt: employeePerformance.excoDecidedAt,
      deletedAt: employeePerformance.deletedAt,
    })
    .from(employeePerformance)
    .leftJoin(employees, eq(employeePerformance.employeeId, employees.id))
    .leftJoin(kpis, eq(employeePerformance.kpiId, kpis.id))
    .leftJoin(kpiCategories, eq(kpis.categoryId, kpiCategories.id))
    .where(and(eq(employeePerformance.id, id), isNull(employeePerformance.deletedAt)))
    .get();
  if (!r) return null;
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    periodYear: r.periodYear,
    periodQuarter: r.periodQuarter ?? null,
    periodLabel: r.periodLabel ?? null,
    kpiId: r.kpiId,
    kpiName: r.kpiName ?? null,
    categoryId: r.categoryId ?? null,
    categoryName: r.categoryName ?? null,
    targetValue: r.targetValue ?? null,
    actualValue: r.actualValue ?? null,
    score: r.score ?? null,
    weight: r.weight,
    managerComments: r.managerComments ?? null,
    employeeComments: r.employeeComments ?? null,
    status: r.status,
    lineManagerId: r.lineManagerId ?? null,
    lineManagerDecidedAt: r.lineManagerDecidedAt ? r.lineManagerDecidedAt.getTime() : null,
    hrId: r.hrId ?? null,
    hrDecidedAt: r.hrDecidedAt ? r.hrDecidedAt.getTime() : null,
    excoDecidedAt: r.excoDecidedAt ? r.excoDecidedAt.getTime() : null,
  };
}

function toPerformanceInsertValues(v: PerformanceFormValues, userId?: number) {
  return {
    employeeId: v.employeeId,
    periodYear: v.periodYear,
    periodQuarter: v.periodQuarter ?? null,
    periodLabel: v.periodLabel ?? null,
    kpiId: v.kpiId,
    targetValue: v.targetValue ?? null,
    actualValue: v.actualValue ?? null,
    score: v.score ?? null,
    weight: v.weight,
    managerComments: v.managerComments ?? null,
    employeeComments: v.employeeComments ?? null,
    status: v.status,
    lineManagerId: v.lineManagerId ?? null,
    hrId: v.hrId ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createPerformance(values: PerformanceFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(employeePerformance).values(toPerformanceInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'employee_performance', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updatePerformance(id: number, values: PerformanceFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeePerformance).where(eq(employeePerformance.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toPerformanceInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(employeePerformance).set(next).where(eq(employeePerformance.id, id)).run();
    const after = tx.select().from(employeePerformance).where(eq(employeePerformance.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'employee_performance', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deletePerformance(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeePerformance).where(eq(employeePerformance.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(employeePerformance)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(employeePerformance.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'employee_performance', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

export async function approvePerformance(req: PerformanceApproveRequest, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeePerformance).where(eq(employeePerformance.id, req.id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    const comments = req.comments ?? null;

    const patch: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };

    let nextStatus = before.status;
    // Append comments on the manager-comments column for traceability.
    const stampComment = (existing: string | null, label: string): string | null => {
      if (!comments) return existing;
      const line = `[${label} ${req.decision} @ ${now.toISOString()}] ${comments}`;
      return existing ? `${existing}\n${line}` : line;
    };

    if (req.step === 'line_manager') {
      patch.lineManagerId = userId;
      patch.lineManagerDecidedAt = now;
      patch.managerComments = stampComment(before.managerComments ?? null, 'Line manager');
      if (req.decision === 'disputed') {
        nextStatus = 'disputed';
      } else if (before.status === 'draft' || before.status === 'submitted') {
        nextStatus = 'reviewed';
      }
    } else if (req.step === 'hr') {
      patch.hrId = userId;
      patch.hrDecidedAt = now;
      patch.managerComments = stampComment(before.managerComments ?? null, 'HR');
      if (req.decision === 'disputed') {
        nextStatus = 'disputed';
      } else {
        nextStatus = 'reviewed';
      }
    } else {
      // exco
      patch.excoDecidedAt = now;
      patch.managerComments = stampComment(before.managerComments ?? null, 'EXCO');
      if (req.decision === 'disputed') {
        nextStatus = 'disputed';
      } else {
        nextStatus = 'approved';
      }
    }
    patch.status = nextStatus;

    tx.update(employeePerformance).set(patch).where(eq(employeePerformance.id, req.id)).run();
    const after = tx.select().from(employeePerformance).where(eq(employeePerformance.id, req.id)).get();
    return {
      result: null,
      envelope: {
        entity: 'employee_performance', entityId: req.id, op: 'update',
        payload: patch, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

/* ---------- KPI categories ---------- */

export function listKpiCategories(includeInactive: boolean): KpiCategoryRow[] {
  const db = getDb();
  const conds = [isNull(kpiCategories.deletedAt)];
  if (!includeInactive) conds.push(eq(kpiCategories.isActive, true));
  const rows = db
    .select()
    .from(kpiCategories)
    .where(and(...conds))
    .orderBy(asc(kpiCategories.sortOrder), asc(kpiCategories.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

function toKpiCategoryInsertValues(v: KpiCategoryFormValues, userId?: number) {
  return {
    code: v.code ?? null,
    name: v.name,
    description: v.description ?? null,
    sortOrder: v.sortOrder,
    isActive: v.isActive,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createKpiCategory(values: KpiCategoryFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(kpiCategories).values(toKpiCategoryInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'kpi_categories', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateKpiCategory(id: number, values: KpiCategoryFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(kpiCategories).where(eq(kpiCategories.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toKpiCategoryInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(kpiCategories).set(next).where(eq(kpiCategories.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'kpi_categories', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteKpiCategory(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(kpiCategories).where(eq(kpiCategories.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(kpiCategories)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(kpiCategories.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'kpi_categories', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- KPIs ---------- */

export function listKpis(req: KpiListRequest): KpiRow[] {
  const db = getDb();
  const conds = [isNull(kpis.deletedAt)];
  if (!req.includeInactive) conds.push(eq(kpis.isActive, true));
  if (req.categoryId) conds.push(eq(kpis.categoryId, req.categoryId));

  const rows = db
    .select({
      id: kpis.id,
      categoryId: kpis.categoryId,
      categoryName: kpiCategories.name,
      code: kpis.code,
      name: kpis.name,
      description: kpis.description,
      unit: kpis.unit,
      targetDirection: kpis.targetDirection,
      isActive: kpis.isActive,
      sortOrder: kpis.sortOrder,
    })
    .from(kpis)
    .leftJoin(kpiCategories, eq(kpis.categoryId, kpiCategories.id))
    .where(and(...conds))
    .orderBy(asc(kpis.sortOrder), asc(kpis.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? null,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    unit: r.unit ?? null,
    targetDirection: r.targetDirection,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  }));
}

function toKpiInsertValues(v: KpiFormValues, userId?: number) {
  return {
    categoryId: v.categoryId,
    code: v.code ?? null,
    name: v.name,
    description: v.description ?? null,
    unit: v.unit ?? null,
    targetDirection: v.targetDirection,
    isActive: v.isActive,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createKpi(values: KpiFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(kpis).values(toKpiInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'kpis', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateKpi(id: number, values: KpiFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(kpis).where(eq(kpis.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toKpiInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(kpis).set(next).where(eq(kpis.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'kpis', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteKpi(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(kpis).where(eq(kpis.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(kpis)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(kpis.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'kpis', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
