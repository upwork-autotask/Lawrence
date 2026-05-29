import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import { employees, developmentPlans, qualDev, skillsDev, devExperience } from '@shared/schema';
import { and, eq, sql, asc, desc, isNull } from 'drizzle-orm';
import type {
  DevelopmentPlanFormValues, DevelopmentListRequest, DevelopmentPlanRow,
  DevelopmentApproveRequest, ApprovalStep,
  QualDevFormValues, QualDevRow,
  SkillsDevFormValues, SkillsDevRow,
  DevExperienceFormValues, DevExperienceRow,
} from '@shared/ipc/development';

/* ---------- Development plans ---------- */

type DevelopmentListResult = { rows: DevelopmentPlanRow[]; total: number };

function toMs(d: Date | null | undefined): number | null {
  return d ? d.getTime() : null;
}

function mapPlanRow(r: {
  id: number;
  employeeId: number;
  firstName: string | null;
  surname: string | null;
  planYear: number;
  summary: string | null;
  status: DevelopmentPlanRow['status'];
  lineManagerId: number | null;
  lineManagerStatus: DevelopmentPlanRow['lineManagerStatus'];
  lineManagerDecidedAt: Date | null;
  lineManagerComments: string | null;
  hrId: number | null;
  hrStatus: DevelopmentPlanRow['hrStatus'];
  hrDecidedAt: Date | null;
  hrComments: string | null;
  complianceId: number | null;
  complianceStatus: DevelopmentPlanRow['complianceStatus'];
  complianceDecidedAt: Date | null;
  complianceComments: string | null;
  excoId: number | null;
  excoStatus: DevelopmentPlanRow['excoStatus'];
  excoDecidedAt: Date | null;
  excoComments: string | null;
  targetCompletionDate: Date | null;
  completedAt: Date | null;
}): DevelopmentPlanRow {
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.firstName && r.surname ? `${r.firstName} ${r.surname}`.trim() : null,
    planYear: r.planYear,
    summary: r.summary ?? null,
    status: r.status,
    lineManagerId: r.lineManagerId ?? null,
    lineManagerStatus: r.lineManagerStatus,
    lineManagerDecidedAt: toMs(r.lineManagerDecidedAt),
    lineManagerComments: r.lineManagerComments ?? null,
    hrId: r.hrId ?? null,
    hrStatus: r.hrStatus,
    hrDecidedAt: toMs(r.hrDecidedAt),
    hrComments: r.hrComments ?? null,
    complianceId: r.complianceId ?? null,
    complianceStatus: r.complianceStatus,
    complianceDecidedAt: toMs(r.complianceDecidedAt),
    complianceComments: r.complianceComments ?? null,
    excoId: r.excoId ?? null,
    excoStatus: r.excoStatus,
    excoDecidedAt: toMs(r.excoDecidedAt),
    excoComments: r.excoComments ?? null,
    targetCompletionDate: toMs(r.targetCompletionDate),
    completedAt: toMs(r.completedAt),
  };
}

const planSelectFields = {
  id: developmentPlans.id,
  employeeId: developmentPlans.employeeId,
  firstName: employees.firstName,
  surname: employees.surname,
  planYear: developmentPlans.planYear,
  summary: developmentPlans.summary,
  status: developmentPlans.status,
  lineManagerId: developmentPlans.lineManagerId,
  lineManagerStatus: developmentPlans.lineManagerStatus,
  lineManagerDecidedAt: developmentPlans.lineManagerDecidedAt,
  lineManagerComments: developmentPlans.lineManagerComments,
  hrId: developmentPlans.hrId,
  hrStatus: developmentPlans.hrStatus,
  hrDecidedAt: developmentPlans.hrDecidedAt,
  hrComments: developmentPlans.hrComments,
  complianceId: developmentPlans.complianceId,
  complianceStatus: developmentPlans.complianceStatus,
  complianceDecidedAt: developmentPlans.complianceDecidedAt,
  complianceComments: developmentPlans.complianceComments,
  excoId: developmentPlans.excoId,
  excoStatus: developmentPlans.excoStatus,
  excoDecidedAt: developmentPlans.excoDecidedAt,
  excoComments: developmentPlans.excoComments,
  targetCompletionDate: developmentPlans.targetCompletionDate,
  completedAt: developmentPlans.completedAt,
} as const;

export function listDevelopmentPlans(req: DevelopmentListRequest): DevelopmentListResult {
  const db = getDb();

  const conds = [isNull(developmentPlans.deletedAt)];
  if (req.status) conds.push(eq(developmentPlans.status, req.status));
  if (req.employeeId) conds.push(eq(developmentPlans.employeeId, req.employeeId));
  if (req.planYear !== undefined) conds.push(eq(developmentPlans.planYear, req.planYear));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname})   LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(coalesce(${developmentPlans.summary}, '')) LIKE ${q}
    )`);
  }

  const where = and(...conds);

  const rows = db
    .select(planSelectFields)
    .from(developmentPlans)
    .leftJoin(employees, eq(developmentPlans.employeeId, employees.id))
    .where(where)
    .orderBy(desc(developmentPlans.planYear), desc(developmentPlans.id))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(developmentPlans)
    .leftJoin(employees, eq(developmentPlans.employeeId, employees.id))
    .where(where)
    .get()?.c ?? 0;

  return { rows: rows.map(mapPlanRow), total };
}

export function getDevelopmentPlan(id: number): DevelopmentPlanRow | null {
  const db = getDb();
  const r = db
    .select(planSelectFields)
    .from(developmentPlans)
    .leftJoin(employees, eq(developmentPlans.employeeId, employees.id))
    .where(and(eq(developmentPlans.id, id), isNull(developmentPlans.deletedAt)))
    .get();
  if (!r) return null;
  return mapPlanRow(r);
}

function toPlanInsertValues(v: DevelopmentPlanFormValues, userId?: number) {
  return {
    employeeId: v.employeeId,
    planYear: v.planYear,
    summary: v.summary ?? null,
    status: v.status,
    lineManagerId: v.lineManagerId ?? null,
    hrId: v.hrId ?? null,
    complianceId: v.complianceId ?? null,
    excoId: v.excoId ?? null,
    targetCompletionDate: v.targetCompletionDate ?? null,
    completedAt: v.completedAt ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createDevelopmentPlan(
  values: DevelopmentPlanFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(developmentPlans).values(toPlanInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'development_plans', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateDevelopmentPlan(
  id: number, values: DevelopmentPlanFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(developmentPlans).where(eq(developmentPlans.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toPlanInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(developmentPlans).set(next).where(eq(developmentPlans.id, id)).run();
    const after = tx.select().from(developmentPlans).where(eq(developmentPlans.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'development_plans', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteDevelopmentPlan(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(developmentPlans).where(eq(developmentPlans.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(developmentPlans)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(developmentPlans.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'development_plans', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

export async function approveDevelopmentPlan(req: DevelopmentApproveRequest, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(developmentPlans).where(eq(developmentPlans.id, req.id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    const comments = req.comments ?? null;
    const decisionStatus = req.decision;

    const patch: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };

    const step: ApprovalStep = req.step;
    if (step === 'line_manager') {
      patch.lineManagerId = userId;
      patch.lineManagerStatus = decisionStatus;
      patch.lineManagerDecidedAt = now;
      patch.lineManagerComments = comments;
    } else if (step === 'hr') {
      patch.hrId = userId;
      patch.hrStatus = decisionStatus;
      patch.hrDecidedAt = now;
      patch.hrComments = comments;
    } else if (step === 'compliance') {
      patch.complianceId = userId;
      patch.complianceStatus = decisionStatus;
      patch.complianceDecidedAt = now;
      patch.complianceComments = comments;
    } else {
      patch.excoId = userId;
      patch.excoStatus = decisionStatus;
      patch.excoDecidedAt = now;
      patch.excoComments = comments;
    }

    // Compute overall status.
    // - Any rejection => overall rejected.
    // - All four approved => overall approved.
    // - Otherwise, if draft, move to submitted (any step has been touched).
    const nextStatuses = {
      lineManager: step === 'line_manager' ? decisionStatus : before.lineManagerStatus,
      hr: step === 'hr' ? decisionStatus : before.hrStatus,
      compliance: step === 'compliance' ? decisionStatus : before.complianceStatus,
      exco: step === 'exco' ? decisionStatus : before.excoStatus,
    };
    let nextStatus = before.status;
    if (
      nextStatuses.lineManager === 'rejected' ||
      nextStatuses.hr === 'rejected' ||
      nextStatuses.compliance === 'rejected' ||
      nextStatuses.exco === 'rejected'
    ) {
      nextStatus = 'cancelled';
    } else if (
      nextStatuses.lineManager === 'approved' &&
      nextStatuses.hr === 'approved' &&
      nextStatuses.compliance === 'approved' &&
      nextStatuses.exco === 'approved'
    ) {
      nextStatus = 'approved';
    } else if (before.status === 'draft') {
      nextStatus = 'submitted';
    }
    patch.status = nextStatus;

    tx.update(developmentPlans).set(patch).where(eq(developmentPlans.id, req.id)).run();
    const after = tx.select().from(developmentPlans).where(eq(developmentPlans.id, req.id)).get();
    return {
      result: null,
      envelope: {
        entity: 'development_plans', entityId: req.id, op: 'update',
        payload: patch, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

/* ---------- Qualifications (qual_dev) ---------- */

export function listQualDev(planId: number): QualDevRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(qualDev)
    .where(and(eq(qualDev.planId, planId), isNull(qualDev.deletedAt)))
    .orderBy(asc(qualDev.sortOrder), asc(qualDev.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    planId: r.planId,
    qualificationName: r.qualificationName,
    institution: r.institution ?? null,
    startDate: toMs(r.startDate),
    targetCompletionDate: toMs(r.targetCompletionDate),
    completionDate: toMs(r.completionDate),
    status: r.status,
    cost: r.cost ?? null,
    sortOrder: r.sortOrder,
    notes: r.notes ?? null,
  }));
}

function toQualInsertValues(v: QualDevFormValues, userId?: number) {
  return {
    planId: v.planId,
    qualificationName: v.qualificationName,
    institution: v.institution ?? null,
    startDate: v.startDate ?? null,
    targetCompletionDate: v.targetCompletionDate ?? null,
    completionDate: v.completionDate ?? null,
    status: v.status,
    cost: v.cost ?? null,
    sortOrder: v.sortOrder,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createQualDev(values: QualDevFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(qualDev).values(toQualInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'qual_dev', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateQualDev(id: number, values: QualDevFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(qualDev).where(eq(qualDev.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toQualInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(qualDev).set(next).where(eq(qualDev.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'qual_dev', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteQualDev(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(qualDev).where(eq(qualDev.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(qualDev)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(qualDev.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'qual_dev', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Skills (skills_dev) ---------- */

export function listSkillsDev(planId: number): SkillsDevRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(skillsDev)
    .where(and(eq(skillsDev.planId, planId), isNull(skillsDev.deletedAt)))
    .orderBy(asc(skillsDev.sortOrder), asc(skillsDev.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    planId: r.planId,
    skillName: r.skillName,
    category: r.category ?? null,
    currentLevel: r.currentLevel,
    targetLevel: r.targetLevel,
    evidence: r.evidence ?? null,
    status: r.status,
    sortOrder: r.sortOrder,
  }));
}

function toSkillInsertValues(v: SkillsDevFormValues, userId?: number) {
  return {
    planId: v.planId,
    skillName: v.skillName,
    category: v.category ?? null,
    currentLevel: v.currentLevel,
    targetLevel: v.targetLevel,
    evidence: v.evidence ?? null,
    status: v.status,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createSkillsDev(values: SkillsDevFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(skillsDev).values(toSkillInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'skills_dev', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateSkillsDev(id: number, values: SkillsDevFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(skillsDev).where(eq(skillsDev.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toSkillInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(skillsDev).set(next).where(eq(skillsDev.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'skills_dev', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteSkillsDev(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(skillsDev).where(eq(skillsDev.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(skillsDev)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(skillsDev.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'skills_dev', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

/* ---------- Experience (dev_experience) ---------- */

export function listDevExperience(planId: number): DevExperienceRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(devExperience)
    .where(and(eq(devExperience.planId, planId), isNull(devExperience.deletedAt)))
    .orderBy(asc(devExperience.sortOrder), asc(devExperience.id))
    .all();
  return rows.map((r) => ({
    id: r.id,
    planId: r.planId,
    experienceType: r.experienceType,
    description: r.description ?? null,
    startDate: toMs(r.startDate),
    endDate: toMs(r.endDate),
    mentorId: r.mentorId ?? null,
    status: r.status,
    outcome: r.outcome ?? null,
    sortOrder: r.sortOrder,
  }));
}

function toExperienceInsertValues(v: DevExperienceFormValues, userId?: number) {
  return {
    planId: v.planId,
    experienceType: v.experienceType,
    description: v.description ?? null,
    startDate: v.startDate ?? null,
    endDate: v.endDate ?? null,
    mentorId: v.mentorId ?? null,
    status: v.status,
    outcome: v.outcome ?? null,
    sortOrder: v.sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createDevExperience(
  values: DevExperienceFormValues, userId: number,
): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(devExperience).values(toExperienceInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'dev_experience', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateDevExperience(
  id: number, values: DevExperienceFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(devExperience).where(eq(devExperience.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      ...toExperienceInsertValues(values, userId),
      updatedAt: new Date(),
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(devExperience).set(next).where(eq(devExperience.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: 'dev_experience', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteDevExperience(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(devExperience).where(eq(devExperience.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(devExperience)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(devExperience.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'dev_experience', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
