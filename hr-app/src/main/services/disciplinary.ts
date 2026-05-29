import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import {
  disciplinaryCases, natureOfOffence, disciplinaryActions, criminalReports,
  employees,
} from '@shared/schema';
import { and, eq, isNull, sql, asc, desc } from 'drizzle-orm';
import type {
  DisciplinaryCaseFormValues, DisciplinaryListRequest, DisciplinaryRow, DisciplinaryStatus,
  NatureOfOffenceFormValues, NatureOfOffenceRow,
  DisciplinaryActionFormValues, DisciplinaryActionRow,
  CriminalReportFormValues, CriminalReportRow,
} from '@shared/ipc/disciplinary';

type ListResult = { rows: DisciplinaryRow[]; total: number };

// ---------- Disciplinary cases ----------

const caseSelect = {
  id: disciplinaryCases.id,
  caseNumber: disciplinaryCases.caseNumber,
  employeeId: disciplinaryCases.employeeId,
  employeeFirstName: employees.firstName,
  employeeSurname: employees.surname,
  offenceId: disciplinaryCases.offenceId,
  offenceName: natureOfOffence.name,
  actionId: disciplinaryCases.actionId,
  actionName: disciplinaryActions.name,
  incidentDate: disciplinaryCases.incidentDate,
  reportedDate: disciplinaryCases.reportedDate,
  reportedBy: disciplinaryCases.reportedBy,
  description: disciplinaryCases.description,
  status: disciplinaryCases.status,
  hearingDate: disciplinaryCases.hearingDate,
  outcome: disciplinaryCases.outcome,
  witnesses: disciplinaryCases.witnesses,
  evidencePath: disciplinaryCases.evidencePath,
  criminalReferral: disciplinaryCases.criminalReferral,
  closedDate: disciplinaryCases.closedDate,
  closedBy: disciplinaryCases.closedBy,
};

interface CaseSelectRow {
  id: number;
  caseNumber: string;
  employeeId: number;
  employeeFirstName: string;
  employeeSurname: string;
  offenceId: number;
  offenceName: string;
  actionId: number | null;
  actionName: string | null;
  incidentDate: Date;
  reportedDate: Date;
  reportedBy: number | null;
  description: string;
  status: DisciplinaryStatus;
  hearingDate: Date | null;
  outcome: string | null;
  witnesses: string | null;
  evidencePath: string | null;
  criminalReferral: number;
  closedDate: Date | null;
  closedBy: number | null;
}

function toRow(r: CaseSelectRow): DisciplinaryRow {
  return {
    id: r.id,
    caseNumber: r.caseNumber,
    employeeId: r.employeeId,
    employeeName: `${r.employeeFirstName} ${r.employeeSurname}`.trim(),
    offenceId: r.offenceId,
    offenceName: r.offenceName,
    actionId: r.actionId,
    actionName: r.actionName,
    incidentDate: r.incidentDate.getTime(),
    reportedDate: r.reportedDate.getTime(),
    reportedBy: r.reportedBy,
    description: r.description,
    status: r.status,
    hearingDate: r.hearingDate ? r.hearingDate.getTime() : null,
    outcome: r.outcome,
    witnesses: r.witnesses,
    evidencePath: r.evidencePath,
    criminalReferral: r.criminalReferral === 1,
    closedDate: r.closedDate ? r.closedDate.getTime() : null,
    closedBy: r.closedBy,
  };
}

export function listDisciplinary(req: DisciplinaryListRequest): ListResult {
  const db = getDb();

  const conds = [isNull(disciplinaryCases.deletedAt)];
  if (req.status) conds.push(eq(disciplinaryCases.status, req.status));
  if (req.employeeId) conds.push(eq(disciplinaryCases.employeeId, req.employeeId));
  if (req.offenceId) conds.push(eq(disciplinaryCases.offenceId, req.offenceId));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${disciplinaryCases.caseNumber}) LIKE ${q} OR
      lower(coalesce(${disciplinaryCases.description}, '')) LIKE ${q} OR
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname}) LIKE ${q}
    )`);
  }

  const where = conds.length ? and(...conds) : undefined;

  const rows = db
    .select(caseSelect)
    .from(disciplinaryCases)
    .innerJoin(employees, eq(disciplinaryCases.employeeId, employees.id))
    .innerJoin(natureOfOffence, eq(disciplinaryCases.offenceId, natureOfOffence.id))
    .leftJoin(disciplinaryActions, eq(disciplinaryCases.actionId, disciplinaryActions.id))
    .where(where)
    .orderBy(desc(disciplinaryCases.reportedDate), asc(disciplinaryCases.caseNumber))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(disciplinaryCases)
    .innerJoin(employees, eq(disciplinaryCases.employeeId, employees.id))
    .innerJoin(natureOfOffence, eq(disciplinaryCases.offenceId, natureOfOffence.id))
    .leftJoin(disciplinaryActions, eq(disciplinaryCases.actionId, disciplinaryActions.id))
    .where(where)
    .get()?.c ?? 0;

  return { rows: rows.map(toRow), total };
}

export function getDisciplinaryCase(id: number): DisciplinaryRow | null {
  const db = getDb();
  const row = db
    .select(caseSelect)
    .from(disciplinaryCases)
    .innerJoin(employees, eq(disciplinaryCases.employeeId, employees.id))
    .innerJoin(natureOfOffence, eq(disciplinaryCases.offenceId, natureOfOffence.id))
    .leftJoin(disciplinaryActions, eq(disciplinaryCases.actionId, disciplinaryActions.id))
    .where(and(eq(disciplinaryCases.id, id), isNull(disciplinaryCases.deletedAt)))
    .get();
  return row ? toRow(row) : null;
}

function toCaseInsertValues(v: DisciplinaryCaseFormValues, userId?: number) {
  return {
    caseNumber: v.caseNumber,
    employeeId: v.employeeId,
    offenceId: v.offenceId,
    actionId: v.actionId ?? null,
    incidentDate: v.incidentDate,
    reportedDate: v.reportedDate,
    reportedBy: v.reportedBy ?? null,
    description: v.description,
    status: v.status,
    hearingDate: v.hearingDate ?? null,
    outcome: v.outcome ?? null,
    witnesses: v.witnesses ?? null,
    evidencePath: v.evidencePath ?? null,
    criminalReferral: v.criminalReferral ? 1 : 0,
    closedDate: v.closedDate ?? null,
    closedBy: v.closedBy ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createDisciplinaryCase(
  values: DisciplinaryCaseFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(disciplinaryCases).values(toCaseInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'disciplinary_cases', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateDisciplinaryCase(
  id: number, values: DisciplinaryCaseFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(disciplinaryCases).where(eq(disciplinaryCases.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toCaseInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(disciplinaryCases).set(next).where(eq(disciplinaryCases.id, id)).run();
    const after = tx.select().from(disciplinaryCases).where(eq(disciplinaryCases.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'disciplinary_cases', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteDisciplinaryCase(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(disciplinaryCases).where(eq(disciplinaryCases.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(disciplinaryCases)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(disciplinaryCases.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'disciplinary_cases', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

// ---------- Nature of offence ----------

export function listNatureOfOffence(includeInactive: boolean): NatureOfOffenceRow[] {
  const db = getDb();
  const conds = [isNull(natureOfOffence.deletedAt)];
  if (!includeInactive) conds.push(eq(natureOfOffence.isActive, true));
  const rows = db.select().from(natureOfOffence).where(and(...conds))
    .orderBy(asc(natureOfOffence.sortOrder), asc(natureOfOffence.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  }));
}

export async function createNatureOfOffence(
  values: NatureOfOffenceFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(natureOfOffence).values({
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      createdBy: userId,
      updatedBy: userId,
    }).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'nature_of_offence', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateNatureOfOffence(
  id: number, values: NatureOfOffenceFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(natureOfOffence).where(eq(natureOfOffence.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      updatedAt: new Date(),
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(natureOfOffence).set(next).where(eq(natureOfOffence.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'nature_of_offence', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteNatureOfOffence(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(natureOfOffence).where(eq(natureOfOffence.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(natureOfOffence).set({
      deletedAt: now, updatedAt: now, updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    }).where(eq(natureOfOffence.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'nature_of_offence', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

// ---------- Disciplinary actions ----------

export function listDisciplinaryActions(includeInactive: boolean): DisciplinaryActionRow[] {
  const db = getDb();
  const conds = [isNull(disciplinaryActions.deletedAt)];
  if (!includeInactive) conds.push(eq(disciplinaryActions.isActive, true));
  const rows = db.select().from(disciplinaryActions).where(and(...conds))
    .orderBy(asc(disciplinaryActions.sortOrder), asc(disciplinaryActions.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  }));
}

export async function createDisciplinaryAction(
  values: DisciplinaryActionFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(disciplinaryActions).values({
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      createdBy: userId,
      updatedBy: userId,
    }).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'disciplinary_actions', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateDisciplinaryAction(
  id: number, values: DisciplinaryActionFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(disciplinaryActions).where(eq(disciplinaryActions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      updatedAt: new Date(),
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(disciplinaryActions).set(next).where(eq(disciplinaryActions.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'disciplinary_actions', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteDisciplinaryAction(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(disciplinaryActions).where(eq(disciplinaryActions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(disciplinaryActions).set({
      deletedAt: now, updatedAt: now, updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    }).where(eq(disciplinaryActions.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'disciplinary_actions', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

// ---------- Criminal reports ----------

export function listCriminalReports(caseId: number): CriminalReportRow[] {
  const db = getDb();
  const rows = db.select().from(criminalReports)
    .where(and(eq(criminalReports.caseId, caseId), isNull(criminalReports.deletedAt)))
    .orderBy(desc(criminalReports.reportedDate))
    .all();
  return rows.map((r) => ({
    id: r.id,
    caseId: r.caseId,
    reportedTo: r.reportedTo,
    reportNumber: r.reportNumber ?? null,
    reportedDate: r.reportedDate.getTime(),
    status: r.status ?? null,
    notes: r.notes ?? null,
  }));
}

function toCriminalReportInsertValues(v: CriminalReportFormValues, userId?: number) {
  return {
    caseId: v.caseId,
    reportedTo: v.reportedTo,
    reportNumber: v.reportNumber ?? null,
    reportedDate: v.reportedDate,
    status: v.status ?? null,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createCriminalReport(
  values: CriminalReportFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(criminalReports).values(toCriminalReportInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'criminal_reports', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateCriminalReport(
  id: number, values: CriminalReportFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(criminalReports).where(eq(criminalReports.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toCriminalReportInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(criminalReports).set(next).where(eq(criminalReports.id, id)).run();
    const after = tx.select().from(criminalReports).where(eq(criminalReports.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'criminal_reports', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteCriminalReport(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(criminalReports).where(eq(criminalReports.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(criminalReports)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(criminalReports.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'criminal_reports', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
