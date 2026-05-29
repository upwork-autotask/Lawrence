import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import {
  jobDescriptions, jdEntries, jdRoles, jdKpis,
  jdTrainingInternal, jdTrainingExternal, employeeJds,
  employees,
} from '@shared/schema';
import { and, eq, isNull, sql, asc, desc } from 'drizzle-orm';
import type {
  JobDescriptionFormValues, JobDescriptionListRequest, JobDescriptionRow,
  JdEntryFormValues, JdEntryRow,
  JdRoleFormValues, JdRoleRow,
  JdKpiFormValues, JdKpiRow,
  JdTrainingFormValues, JdTrainingRow,
  EmployeeJdFormValues, EmployeeJdListRequest, EmployeeJdRow,
} from '@shared/ipc/job-descriptions';

/* ---------- Job descriptions (master) ---------- */

type JdListResult = { rows: JobDescriptionRow[]; total: number };

export function listJobDescriptions(req: JobDescriptionListRequest): JdListResult {
  const db = getDb();

  const conds = [isNull(jobDescriptions.deletedAt)];
  if (req.status) conds.push(eq(jobDescriptions.status, req.status));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${jobDescriptions.title}) LIKE ${q} OR
      lower(coalesce(${jobDescriptions.summary}, '')) LIKE ${q} OR
      lower(coalesce(${jobDescriptions.reportsToTitle}, '')) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select()
    .from(jobDescriptions)
    .where(where)
    .orderBy(asc(jobDescriptions.title), desc(jobDescriptions.version))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(jobDescriptions)
    .where(where)
    .get()?.c ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      version: r.version,
      status: r.status,
      summary: r.summary ?? null,
      reportsToTitle: r.reportsToTitle ?? null,
      preparedBy: r.preparedBy ?? null,
      approvedByCeoAt: r.approvedByCeoAt ? r.approvedByCeoAt.getTime() : null,
      effectiveDate: r.effectiveDate ? r.effectiveDate.getTime() : null,
      retiredDate: r.retiredDate ? r.retiredDate.getTime() : null,
    })),
    total,
  };
}

export function getJobDescription(id: number): JobDescriptionRow | null {
  const db = getDb();
  const r = db
    .select()
    .from(jobDescriptions)
    .where(and(eq(jobDescriptions.id, id), isNull(jobDescriptions.deletedAt)))
    .get();
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    version: r.version,
    status: r.status,
    summary: r.summary ?? null,
    reportsToTitle: r.reportsToTitle ?? null,
    preparedBy: r.preparedBy ?? null,
    approvedByCeoAt: r.approvedByCeoAt ? r.approvedByCeoAt.getTime() : null,
    effectiveDate: r.effectiveDate ? r.effectiveDate.getTime() : null,
    retiredDate: r.retiredDate ? r.retiredDate.getTime() : null,
  };
}

function toJdInsertValues(v: JobDescriptionFormValues, userId?: number) {
  return {
    title: v.title,
    version: v.version,
    status: v.status,
    summary: v.summary ?? null,
    reportsToTitle: v.reportsToTitle ?? null,
    preparedBy: v.preparedBy ?? null,
    approvedByCeoAt: v.approvedByCeoAt ?? null,
    effectiveDate: v.effectiveDate ?? null,
    retiredDate: v.retiredDate ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createJobDescription(values: JobDescriptionFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(jobDescriptions).values(toJdInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'job_descriptions', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateJobDescription(id: number, values: JobDescriptionFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jobDescriptions).where(eq(jobDescriptions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toJdInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(jobDescriptions).set(next).where(eq(jobDescriptions.id, id)).run();
    const after = tx.select().from(jobDescriptions).where(eq(jobDescriptions.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'job_descriptions', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteJobDescription(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jobDescriptions).where(eq(jobDescriptions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(jobDescriptions)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(jobDescriptions.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'job_descriptions', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- JD entries ---------- */

export function listJdEntries(jdId: number): JdEntryRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(jdEntries)
    .where(and(eq(jdEntries.jdId, jdId), isNull(jdEntries.deletedAt)))
    .orderBy(asc(jdEntries.sortOrder), asc(jdEntries.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    jdId: r.jdId,
    section: r.section,
    body: r.body ?? null,
    sortOrder: r.sortOrder,
  }));
}

function toJdEntryInsertValues(v: JdEntryFormValues, userId?: number) {
  return {
    jdId: v.jdId,
    section: v.section,
    body: v.body ?? null,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createJdEntry(values: JdEntryFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(jdEntries).values(toJdEntryInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'jd_entries', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateJdEntry(id: number, values: JdEntryFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdEntries).where(eq(jdEntries.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toJdEntryInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(jdEntries).set(next).where(eq(jdEntries.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'jd_entries', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteJdEntry(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdEntries).where(eq(jdEntries.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(jdEntries)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(jdEntries.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'jd_entries', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- JD roles ---------- */

export function listJdRoles(jdId: number): JdRoleRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(jdRoles)
    .where(and(eq(jdRoles.jdId, jdId), isNull(jdRoles.deletedAt)))
    .orderBy(asc(jdRoles.sortOrder), asc(jdRoles.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    jdId: r.jdId,
    description: r.description,
    weight: r.weight,
    sortOrder: r.sortOrder,
  }));
}

function toJdRoleInsertValues(v: JdRoleFormValues, userId?: number) {
  return {
    jdId: v.jdId,
    description: v.description,
    weight: v.weight,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createJdRole(values: JdRoleFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(jdRoles).values(toJdRoleInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'jd_roles', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateJdRole(id: number, values: JdRoleFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdRoles).where(eq(jdRoles.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toJdRoleInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(jdRoles).set(next).where(eq(jdRoles.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'jd_roles', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteJdRole(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdRoles).where(eq(jdRoles.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(jdRoles)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(jdRoles.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'jd_roles', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- JD KPIs ---------- */

export function listJdKpis(jdId: number): JdKpiRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(jdKpis)
    .where(and(eq(jdKpis.jdId, jdId), isNull(jdKpis.deletedAt)))
    .orderBy(asc(jdKpis.sortOrder), asc(jdKpis.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    jdId: r.jdId,
    kpiId: r.kpiId ?? null,
    target: r.target ?? null,
    weight: r.weight,
    sortOrder: r.sortOrder,
  }));
}

function toJdKpiInsertValues(v: JdKpiFormValues, userId?: number) {
  return {
    jdId: v.jdId,
    kpiId: v.kpiId ?? null,
    target: v.target ?? null,
    weight: v.weight,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createJdKpi(values: JdKpiFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(jdKpis).values(toJdKpiInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'jd_kpis', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateJdKpi(id: number, values: JdKpiFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdKpis).where(eq(jdKpis.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toJdKpiInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(jdKpis).set(next).where(eq(jdKpis.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'jd_kpis', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteJdKpi(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(jdKpis).where(eq(jdKpis.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(jdKpis)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(jdKpis.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'jd_kpis', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- JD training (internal & external share shape) ---------- */

type JdTrainingKind = 'internal' | 'external';

function trainingTable(kind: JdTrainingKind) {
  return kind === 'internal' ? jdTrainingInternal : jdTrainingExternal;
}

function trainingEntity(kind: JdTrainingKind): string {
  return kind === 'internal' ? 'jd_training_internal' : 'jd_training_external';
}

export function listJdTraining(kind: JdTrainingKind, jdId: number): JdTrainingRow[] {
  const db = getDb();
  const t = trainingTable(kind);
  const rows = db
    .select()
    .from(t)
    .where(and(eq(t.jdId, jdId), isNull(t.deletedAt)))
    .orderBy(asc(t.sortOrder), asc(t.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    jdId: r.jdId,
    trainingId: r.trainingId ?? null,
    required: r.required,
    frequency: r.frequency ?? null,
    sortOrder: r.sortOrder,
  }));
}

function toJdTrainingInsertValues(v: JdTrainingFormValues, userId?: number) {
  return {
    jdId: v.jdId,
    trainingId: v.trainingId ?? null,
    required: v.required,
    frequency: v.frequency ?? null,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createJdTraining(
  kind: JdTrainingKind, values: JdTrainingFormValues, userId: number,
): Promise<{ id: number }> {
  const t = trainingTable(kind);
  const entity = trainingEntity(kind);
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(t).values(toJdTrainingInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity, entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateJdTraining(
  kind: JdTrainingKind, id: number, values: JdTrainingFormValues, userId: number,
): Promise<void> {
  const t = trainingTable(kind);
  const entity = trainingEntity(kind);
  await mutate<null>((tx) => {
    const before = tx.select().from(t).where(eq(t.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toJdTrainingInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(t).set(next).where(eq(t.id, id)).run();
    return {
      result: null,
      envelope: {
        entity, entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteJdTraining(
  kind: JdTrainingKind, id: number, userId: number,
): Promise<void> {
  const t = trainingTable(kind);
  const entity = trainingEntity(kind);
  await mutate<null>((tx) => {
    const before = tx.select().from(t).where(eq(t.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(t)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(t.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity, entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Employee JD assignments ---------- */

export function listEmployeeJds(req: EmployeeJdListRequest): EmployeeJdRow[] {
  const db = getDb();

  const conds = [isNull(employeeJds.deletedAt)];
  if (req.jdId) conds.push(eq(employeeJds.jdId, req.jdId));
  if (req.employeeId) conds.push(eq(employeeJds.employeeId, req.employeeId));
  if (req.status) conds.push(eq(employeeJds.status, req.status));

  const rows = db
    .select({
      id: employeeJds.id,
      employeeId: employeeJds.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      jdId: employeeJds.jdId,
      jdTitle: jobDescriptions.title,
      jdVersion: jobDescriptions.version,
      assignedAt: employeeJds.assignedAt,
      lineManagerId: employeeJds.lineManagerId,
      hrId: employeeJds.hrId,
      ceoApprovedAt: employeeJds.ceoApprovedAt,
      status: employeeJds.status,
      notes: employeeJds.notes,
    })
    .from(employeeJds)
    .leftJoin(employees, eq(employeeJds.employeeId, employees.id))
    .leftJoin(jobDescriptions, eq(employeeJds.jdId, jobDescriptions.id))
    .where(and(...conds))
    .orderBy(desc(employeeJds.assignedAt))
    .all();

  return rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    jdId: r.jdId,
    jdTitle: r.jdTitle ?? null,
    jdVersion: r.jdVersion ?? null,
    assignedAt: r.assignedAt.getTime(),
    lineManagerId: r.lineManagerId ?? null,
    hrId: r.hrId ?? null,
    ceoApprovedAt: r.ceoApprovedAt ? r.ceoApprovedAt.getTime() : null,
    status: r.status,
    notes: r.notes ?? null,
  }));
}

function toEmployeeJdInsertValues(v: EmployeeJdFormValues, userId?: number) {
  return {
    employeeId: v.employeeId,
    jdId: v.jdId,
    assignedAt: v.assignedAt,
    lineManagerId: v.lineManagerId ?? null,
    hrId: v.hrId ?? null,
    ceoApprovedAt: v.ceoApprovedAt ?? null,
    status: v.status,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createEmployeeJd(values: EmployeeJdFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(employeeJds).values(toEmployeeJdInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'employee_jds', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateEmployeeJd(id: number, values: EmployeeJdFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeeJds).where(eq(employeeJds.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toEmployeeJdInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(employeeJds).set(next).where(eq(employeeJds.id, id)).run();
    const after = tx.select().from(employeeJds).where(eq(employeeJds.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'employee_jds', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteEmployeeJd(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeeJds).where(eq(employeeJds.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(employeeJds)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(employeeJds.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'employee_jds', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
