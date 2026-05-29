import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import {
  trainingsCatalogue, trainingInternal, trainingExternal,
  analysisSkills, quizQuestions, quizAnswers, employeeTests,
  employees,
} from '@shared/schema';
import { and, eq, isNull, sql, asc, desc } from 'drizzle-orm';
import type {
  TrainingCatalogueFormValues, TrainingCatalogueListRequest, TrainingCatalogueRow,
  TrainingInternalFormValues, TrainingInternalListRequest, TrainingInternalRow,
  TrainingExternalFormValues, TrainingExternalListRequest, TrainingExternalRow,
  TrainingApproveRequest,
  AnalysisSkillsFormValues, AnalysisSkillsListRequest, AnalysisSkillsRow,
  QuizQuestionFormValues, QuizQuestionListRequest, QuizQuestionRow,
  QuizAnswerFormValues, QuizAnswerListRequest, QuizAnswerRow,
  EmployeeTestFormValues, EmployeeTestListRequest, EmployeeTestRow,
} from '@shared/ipc/training';

/* ---------- Trainings catalogue ---------- */

type CatalogueListResult = { rows: TrainingCatalogueRow[]; total: number };

export function listTrainingsCatalogue(req: TrainingCatalogueListRequest): CatalogueListResult {
  const db = getDb();

  const conds = [isNull(trainingsCatalogue.deletedAt)];
  if (!req.includeInactive) conds.push(eq(trainingsCatalogue.isActive, true));
  if (req.kind) conds.push(eq(trainingsCatalogue.kind, req.kind));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${trainingsCatalogue.name}) LIKE ${q} OR
      lower(coalesce(${trainingsCatalogue.code}, '')) LIKE ${q} OR
      lower(coalesce(${trainingsCatalogue.provider}, '')) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select()
    .from(trainingsCatalogue)
    .where(where)
    .orderBy(asc(trainingsCatalogue.name))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(trainingsCatalogue)
    .where(where)
    .get()?.c ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code ?? null,
      name: r.name,
      kind: r.kind,
      provider: r.provider ?? null,
      durationHours: r.durationHours ?? null,
      cost: r.cost ?? null,
      description: r.description ?? null,
      isActive: r.isActive,
      requiresQuiz: r.requiresQuiz,
    })),
    total,
  };
}

export function getTrainingCatalogue(id: number): TrainingCatalogueRow | null {
  const db = getDb();
  const r = db
    .select()
    .from(trainingsCatalogue)
    .where(and(eq(trainingsCatalogue.id, id), isNull(trainingsCatalogue.deletedAt)))
    .get();
  if (!r) return null;
  return {
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    kind: r.kind,
    provider: r.provider ?? null,
    durationHours: r.durationHours ?? null,
    cost: r.cost ?? null,
    description: r.description ?? null,
    isActive: r.isActive,
    requiresQuiz: r.requiresQuiz,
  };
}

function toCatalogueInsertValues(v: TrainingCatalogueFormValues, userId?: number) {
  return {
    code: v.code ?? null,
    name: v.name,
    kind: v.kind,
    provider: v.provider ?? null,
    durationHours: v.durationHours ?? null,
    cost: v.cost ?? null,
    description: v.description ?? null,
    isActive: v.isActive,
    requiresQuiz: v.requiresQuiz,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createTrainingCatalogue(
  values: TrainingCatalogueFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(trainingsCatalogue).values(toCatalogueInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'trainings_catalogue', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateTrainingCatalogue(
  id: number, values: TrainingCatalogueFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingsCatalogue).where(eq(trainingsCatalogue.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toCatalogueInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(trainingsCatalogue).set(next).where(eq(trainingsCatalogue.id, id)).run();
    const after = tx.select().from(trainingsCatalogue).where(eq(trainingsCatalogue.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'trainings_catalogue', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteTrainingCatalogue(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingsCatalogue).where(eq(trainingsCatalogue.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(trainingsCatalogue)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(trainingsCatalogue.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'trainings_catalogue', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Internal training sessions ---------- */

const internalSelect = {
  id: trainingInternal.id,
  trainingId: trainingInternal.trainingId,
  trainingName: trainingsCatalogue.name,
  trainingKind: trainingsCatalogue.kind,
  employeeId: trainingInternal.employeeId,
  employeeFirstName: employees.firstName,
  employeeSurname: employees.surname,
  scheduledDate: trainingInternal.scheduledDate,
  startedAt: trainingInternal.startedAt,
  completedAt: trainingInternal.completedAt,
  score: trainingInternal.score,
  status: trainingInternal.status,
  certificatePath: trainingInternal.certificatePath,
  approvalStatus: trainingInternal.approvalStatus,
  approvedBy: trainingInternal.approvedBy,
  approvedAt: trainingInternal.approvedAt,
  notes: trainingInternal.notes,
};

interface InternalSelectRow {
  id: number;
  trainingId: number;
  trainingName: string | null;
  trainingKind: 'internal' | 'external' | 'blended' | null;
  employeeId: number;
  employeeFirstName: string | null;
  employeeSurname: string | null;
  scheduledDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  score: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'no_show';
  certificatePath: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: number | null;
  approvedAt: Date | null;
  notes: string | null;
}

function toInternalRow(r: InternalSelectRow): TrainingInternalRow {
  return {
    id: r.id,
    trainingId: r.trainingId,
    trainingName: r.trainingName,
    trainingKind: r.trainingKind,
    employeeId: r.employeeId,
    employeeName: r.employeeFirstName && r.employeeSurname
      ? `${r.employeeFirstName} ${r.employeeSurname}`.trim() : null,
    scheduledDate: r.scheduledDate ? r.scheduledDate.getTime() : null,
    startedAt: r.startedAt ? r.startedAt.getTime() : null,
    completedAt: r.completedAt ? r.completedAt.getTime() : null,
    score: r.score,
    status: r.status,
    certificatePath: r.certificatePath,
    approvalStatus: r.approvalStatus,
    approvedBy: r.approvedBy,
    approvedAt: r.approvedAt ? r.approvedAt.getTime() : null,
    notes: r.notes,
  };
}

export function listTrainingInternal(req: TrainingInternalListRequest): { rows: TrainingInternalRow[]; total: number } {
  const db = getDb();

  const conds = [isNull(trainingInternal.deletedAt)];
  if (req.status) conds.push(eq(trainingInternal.status, req.status));
  if (req.approvalStatus) conds.push(eq(trainingInternal.approvalStatus, req.approvalStatus));
  if (req.employeeId) conds.push(eq(trainingInternal.employeeId, req.employeeId));
  if (req.trainingId) conds.push(eq(trainingInternal.trainingId, req.trainingId));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname}) LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(${trainingsCatalogue.name}) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select(internalSelect)
    .from(trainingInternal)
    .leftJoin(employees, eq(trainingInternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingInternal.trainingId, trainingsCatalogue.id))
    .where(where)
    .orderBy(desc(trainingInternal.scheduledDate))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(trainingInternal)
    .leftJoin(employees, eq(trainingInternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingInternal.trainingId, trainingsCatalogue.id))
    .where(where)
    .get()?.c ?? 0;

  return { rows: rows.map(toInternalRow), total };
}

export function getTrainingInternal(id: number): TrainingInternalRow | null {
  const db = getDb();
  const r = db
    .select(internalSelect)
    .from(trainingInternal)
    .leftJoin(employees, eq(trainingInternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingInternal.trainingId, trainingsCatalogue.id))
    .where(and(eq(trainingInternal.id, id), isNull(trainingInternal.deletedAt)))
    .get();
  return r ? toInternalRow(r) : null;
}

function toInternalInsertValues(v: TrainingInternalFormValues, userId?: number) {
  return {
    trainingId: v.trainingId,
    employeeId: v.employeeId,
    scheduledDate: v.scheduledDate ?? null,
    startedAt: v.startedAt ?? null,
    completedAt: v.completedAt ?? null,
    score: v.score ?? null,
    status: v.status,
    certificatePath: v.certificatePath ?? null,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createTrainingInternal(
  values: TrainingInternalFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(trainingInternal).values(toInternalInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'training_internal', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateTrainingInternal(
  id: number, values: TrainingInternalFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingInternal).where(eq(trainingInternal.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toInternalInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(trainingInternal).set(next).where(eq(trainingInternal.id, id)).run();
    const after = tx.select().from(trainingInternal).where(eq(trainingInternal.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'training_internal', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteTrainingInternal(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingInternal).where(eq(trainingInternal.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(trainingInternal)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(trainingInternal.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'training_internal', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- External training sessions ---------- */

const externalSelect = {
  id: trainingExternal.id,
  trainingId: trainingExternal.trainingId,
  trainingName: trainingsCatalogue.name,
  trainingKind: trainingsCatalogue.kind,
  employeeId: trainingExternal.employeeId,
  employeeFirstName: employees.firstName,
  employeeSurname: employees.surname,
  providerName: trainingExternal.providerName,
  venue: trainingExternal.venue,
  scheduledDate: trainingExternal.scheduledDate,
  startedAt: trainingExternal.startedAt,
  completedAt: trainingExternal.completedAt,
  score: trainingExternal.score,
  status: trainingExternal.status,
  certificatePath: trainingExternal.certificatePath,
  poNumber: trainingExternal.poNumber,
  cost: trainingExternal.cost,
  approvalStatus: trainingExternal.approvalStatus,
  approvedBy: trainingExternal.approvedBy,
  approvedAt: trainingExternal.approvedAt,
  notes: trainingExternal.notes,
};

interface ExternalSelectRow {
  id: number;
  trainingId: number;
  trainingName: string | null;
  trainingKind: 'internal' | 'external' | 'blended' | null;
  employeeId: number;
  employeeFirstName: string | null;
  employeeSurname: string | null;
  providerName: string;
  venue: string | null;
  scheduledDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  score: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'no_show';
  certificatePath: string | null;
  poNumber: string | null;
  cost: number | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: number | null;
  approvedAt: Date | null;
  notes: string | null;
}

function toExternalRow(r: ExternalSelectRow): TrainingExternalRow {
  return {
    id: r.id,
    trainingId: r.trainingId,
    trainingName: r.trainingName,
    trainingKind: r.trainingKind,
    employeeId: r.employeeId,
    employeeName: r.employeeFirstName && r.employeeSurname
      ? `${r.employeeFirstName} ${r.employeeSurname}`.trim() : null,
    providerName: r.providerName,
    venue: r.venue,
    scheduledDate: r.scheduledDate ? r.scheduledDate.getTime() : null,
    startedAt: r.startedAt ? r.startedAt.getTime() : null,
    completedAt: r.completedAt ? r.completedAt.getTime() : null,
    score: r.score,
    status: r.status,
    certificatePath: r.certificatePath,
    poNumber: r.poNumber,
    cost: r.cost,
    approvalStatus: r.approvalStatus,
    approvedBy: r.approvedBy,
    approvedAt: r.approvedAt ? r.approvedAt.getTime() : null,
    notes: r.notes,
  };
}

export function listTrainingExternal(req: TrainingExternalListRequest): { rows: TrainingExternalRow[]; total: number } {
  const db = getDb();

  const conds = [isNull(trainingExternal.deletedAt)];
  if (req.status) conds.push(eq(trainingExternal.status, req.status));
  if (req.approvalStatus) conds.push(eq(trainingExternal.approvalStatus, req.approvalStatus));
  if (req.employeeId) conds.push(eq(trainingExternal.employeeId, req.employeeId));
  if (req.trainingId) conds.push(eq(trainingExternal.trainingId, req.trainingId));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname}) LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(${trainingsCatalogue.name}) LIKE ${q} OR
      lower(${trainingExternal.providerName}) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select(externalSelect)
    .from(trainingExternal)
    .leftJoin(employees, eq(trainingExternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingExternal.trainingId, trainingsCatalogue.id))
    .where(where)
    .orderBy(desc(trainingExternal.scheduledDate))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(trainingExternal)
    .leftJoin(employees, eq(trainingExternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingExternal.trainingId, trainingsCatalogue.id))
    .where(where)
    .get()?.c ?? 0;

  return { rows: rows.map(toExternalRow), total };
}

export function getTrainingExternal(id: number): TrainingExternalRow | null {
  const db = getDb();
  const r = db
    .select(externalSelect)
    .from(trainingExternal)
    .leftJoin(employees, eq(trainingExternal.employeeId, employees.id))
    .leftJoin(trainingsCatalogue, eq(trainingExternal.trainingId, trainingsCatalogue.id))
    .where(and(eq(trainingExternal.id, id), isNull(trainingExternal.deletedAt)))
    .get();
  return r ? toExternalRow(r) : null;
}

function toExternalInsertValues(v: TrainingExternalFormValues, userId?: number) {
  return {
    trainingId: v.trainingId,
    employeeId: v.employeeId,
    providerName: v.providerName,
    venue: v.venue ?? null,
    scheduledDate: v.scheduledDate ?? null,
    startedAt: v.startedAt ?? null,
    completedAt: v.completedAt ?? null,
    score: v.score ?? null,
    status: v.status,
    certificatePath: v.certificatePath ?? null,
    poNumber: v.poNumber ?? null,
    cost: v.cost ?? null,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createTrainingExternal(
  values: TrainingExternalFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(trainingExternal).values(toExternalInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'training_external', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateTrainingExternal(
  id: number, values: TrainingExternalFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingExternal).where(eq(trainingExternal.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toExternalInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(trainingExternal).set(next).where(eq(trainingExternal.id, id)).run();
    const after = tx.select().from(trainingExternal).where(eq(trainingExternal.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'training_external', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteTrainingExternal(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(trainingExternal).where(eq(trainingExternal.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(trainingExternal)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(trainingExternal.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'training_external', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Approvals (internal + external) ---------- */

export async function approveTraining(req: TrainingApproveRequest, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const now = new Date();
    if (req.kind === 'internal') {
      const before = tx.select().from(trainingInternal).where(eq(trainingInternal.id, req.id)).get();
      if (!before || before.deletedAt) {
        throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
      }
      const patch = {
        approvalStatus: req.decision,
        approvedBy: userId,
        approvedAt: now,
        notes: req.notes ?? before.notes ?? null,
        updatedAt: now,
        updatedBy: userId,
        syncVersion: (before.syncVersion ?? 0) + 1,
      };
      tx.update(trainingInternal).set(patch).where(eq(trainingInternal.id, req.id)).run();
      const after = tx.select().from(trainingInternal).where(eq(trainingInternal.id, req.id)).get();
      return {
        result: null,
        envelope: {
          entity: 'training_internal', entityId: req.id, op: 'update',
          payload: patch, baseVersion: before.syncVersion ?? 0, userId,
          before, after,
        },
      };
    }
    const before = tx.select().from(trainingExternal).where(eq(trainingExternal.id, req.id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const patch = {
      approvalStatus: req.decision,
      approvedBy: userId,
      approvedAt: now,
      notes: req.notes ?? before.notes ?? null,
      updatedAt: now,
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(trainingExternal).set(patch).where(eq(trainingExternal.id, req.id)).run();
    const after = tx.select().from(trainingExternal).where(eq(trainingExternal.id, req.id)).get();
    return {
      result: null,
      envelope: {
        entity: 'training_external', entityId: req.id, op: 'update',
        payload: patch, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

/* ---------- Analysis skills ---------- */

export function listAnalysisSkills(req: AnalysisSkillsListRequest): AnalysisSkillsRow[] {
  const db = getDb();
  const conds = [isNull(analysisSkills.deletedAt)];
  if (req.employeeId) conds.push(eq(analysisSkills.employeeId, req.employeeId));
  if (req.trainingInternalId) conds.push(eq(analysisSkills.trainingInternalId, req.trainingInternalId));
  if (req.trainingExternalId) conds.push(eq(analysisSkills.trainingExternalId, req.trainingExternalId));

  const rows = db
    .select({
      id: analysisSkills.id,
      trainingInternalId: analysisSkills.trainingInternalId,
      trainingExternalId: analysisSkills.trainingExternalId,
      employeeId: analysisSkills.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      bookingComplete: analysisSkills.bookingComplete,
      approvalComplete: analysisSkills.approvalComplete,
      poComplete: analysisSkills.poComplete,
      startComplete: analysisSkills.startComplete,
      endComplete: analysisSkills.endComplete,
      certificateComplete: analysisSkills.certificateComplete,
    })
    .from(analysisSkills)
    .leftJoin(employees, eq(analysisSkills.employeeId, employees.id))
    .where(and(...conds))
    .orderBy(desc(analysisSkills.id))
    .all();

  return rows.map((r) => ({
    id: r.id,
    trainingInternalId: r.trainingInternalId ?? null,
    trainingExternalId: r.trainingExternalId ?? null,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    bookingComplete: r.bookingComplete,
    approvalComplete: r.approvalComplete,
    poComplete: r.poComplete,
    startComplete: r.startComplete,
    endComplete: r.endComplete,
    certificateComplete: r.certificateComplete,
  }));
}

function toAnalysisSkillsInsertValues(v: AnalysisSkillsFormValues, userId?: number) {
  return {
    trainingInternalId: v.trainingInternalId ?? null,
    trainingExternalId: v.trainingExternalId ?? null,
    employeeId: v.employeeId,
    bookingComplete: v.bookingComplete,
    approvalComplete: v.approvalComplete,
    poComplete: v.poComplete,
    startComplete: v.startComplete,
    endComplete: v.endComplete,
    certificateComplete: v.certificateComplete,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createAnalysisSkills(
  values: AnalysisSkillsFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(analysisSkills).values(toAnalysisSkillsInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'analysis_skills', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateAnalysisSkills(
  id: number, values: AnalysisSkillsFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(analysisSkills).where(eq(analysisSkills.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toAnalysisSkillsInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(analysisSkills).set(next).where(eq(analysisSkills.id, id)).run();
    const after = tx.select().from(analysisSkills).where(eq(analysisSkills.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'analysis_skills', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteAnalysisSkills(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(analysisSkills).where(eq(analysisSkills.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(analysisSkills)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(analysisSkills.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'analysis_skills', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Quiz questions ---------- */

export function listQuizQuestions(req: QuizQuestionListRequest): QuizQuestionRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(quizQuestions)
    .where(and(eq(quizQuestions.trainingId, req.trainingId), isNull(quizQuestions.deletedAt)))
    .orderBy(asc(quizQuestions.sortOrder), asc(quizQuestions.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    trainingId: r.trainingId,
    question: r.question,
    kind: r.kind,
    points: r.points,
    sortOrder: r.sortOrder,
    explanation: r.explanation ?? null,
  }));
}

function toQuizQuestionInsertValues(v: QuizQuestionFormValues, userId?: number) {
  return {
    trainingId: v.trainingId,
    question: v.question,
    kind: v.kind,
    points: v.points,
    sortOrder: v.sortOrder,
    explanation: v.explanation ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createQuizQuestion(
  values: QuizQuestionFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(quizQuestions).values(toQuizQuestionInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'quiz_questions', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateQuizQuestion(
  id: number, values: QuizQuestionFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(quizQuestions).where(eq(quizQuestions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toQuizQuestionInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(quizQuestions).set(next).where(eq(quizQuestions.id, id)).run();
    const after = tx.select().from(quizQuestions).where(eq(quizQuestions.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'quiz_questions', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteQuizQuestion(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(quizQuestions).where(eq(quizQuestions.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(quizQuestions)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(quizQuestions.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'quiz_questions', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Quiz answers ---------- */

export function listQuizAnswers(req: QuizAnswerListRequest): QuizAnswerRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(quizAnswers)
    .where(and(eq(quizAnswers.questionId, req.questionId), isNull(quizAnswers.deletedAt)))
    .orderBy(asc(quizAnswers.sortOrder), asc(quizAnswers.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    questionId: r.questionId,
    answerText: r.answerText,
    isCorrect: r.isCorrect,
    sortOrder: r.sortOrder,
  }));
}

function toQuizAnswerInsertValues(v: QuizAnswerFormValues, userId?: number) {
  return {
    questionId: v.questionId,
    answerText: v.answerText,
    isCorrect: v.isCorrect,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createQuizAnswer(
  values: QuizAnswerFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(quizAnswers).values(toQuizAnswerInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'quiz_answers', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateQuizAnswer(
  id: number, values: QuizAnswerFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(quizAnswers).where(eq(quizAnswers.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toQuizAnswerInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(quizAnswers).set(next).where(eq(quizAnswers.id, id)).run();
    const after = tx.select().from(quizAnswers).where(eq(quizAnswers.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'quiz_answers', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteQuizAnswer(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(quizAnswers).where(eq(quizAnswers.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(quizAnswers)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(quizAnswers.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'quiz_answers', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Employee tests ---------- */

export function listEmployeeTests(req: EmployeeTestListRequest): EmployeeTestRow[] {
  const db = getDb();
  const conds = [isNull(employeeTests.deletedAt)];
  if (req.employeeId) conds.push(eq(employeeTests.employeeId, req.employeeId));
  if (req.trainingInternalId) conds.push(eq(employeeTests.trainingInternalId, req.trainingInternalId));

  const rows = db
    .select({
      id: employeeTests.id,
      trainingInternalId: employeeTests.trainingInternalId,
      employeeId: employeeTests.employeeId,
      firstName: employees.firstName,
      surname: employees.surname,
      startedAt: employeeTests.startedAt,
      completedAt: employeeTests.completedAt,
      score: employeeTests.score,
      percentage: employeeTests.percentage,
      passed: employeeTests.passed,
      responsesJson: employeeTests.responsesJson,
    })
    .from(employeeTests)
    .leftJoin(employees, eq(employeeTests.employeeId, employees.id))
    .where(and(...conds))
    .orderBy(desc(employeeTests.startedAt))
    .all();

  return rows.map((r) => ({
    id: r.id,
    trainingInternalId: r.trainingInternalId,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    startedAt: r.startedAt.getTime(),
    completedAt: r.completedAt ? r.completedAt.getTime() : null,
    score: r.score ?? null,
    percentage: r.percentage ?? null,
    passed: r.passed ?? null,
    responsesJson: r.responsesJson ?? null,
  }));
}

function toEmployeeTestInsertValues(v: EmployeeTestFormValues, userId?: number) {
  return {
    trainingInternalId: v.trainingInternalId,
    employeeId: v.employeeId,
    startedAt: v.startedAt,
    completedAt: v.completedAt ?? null,
    score: v.score ?? null,
    percentage: v.percentage ?? null,
    passed: v.passed ?? null,
    responsesJson: v.responsesJson ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createEmployeeTest(
  values: EmployeeTestFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(employeeTests).values(toEmployeeTestInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'employee_tests', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateEmployeeTest(
  id: number, values: EmployeeTestFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeeTests).where(eq(employeeTests.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toEmployeeTestInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(employeeTests).set(next).where(eq(employeeTests.id, id)).run();
    const after = tx.select().from(employeeTests).where(eq(employeeTests.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'employee_tests', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteEmployeeTest(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employeeTests).where(eq(employeeTests.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(employeeTests)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(employeeTests.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'employee_tests', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
