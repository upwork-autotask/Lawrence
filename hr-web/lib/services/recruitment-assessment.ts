import { asc, eq, type SQL } from 'drizzle-orm';
import { candidates, employees } from '../db/schema';
import { candidateAssessments } from '../db/schema/recruitment-assessment';
import { crudList, crudGet, crudCreate, crudUpdate } from '../api/crud';
import { Errors } from '../api/errors';
import type { Ctx } from '../api/handler';
import { ASSESSMENT_SCORE_KEYS } from '../api/contracts/recruitment-assessment';

/** Sum the leading-integer scored answers (Access `FrmRecruitmentForm` total). */
export function computeTotalScore(values: Record<string, unknown>): number {
  let total = 0;
  for (const key of ASSESSMENT_SCORE_KEYS) {
    const v = values[key];
    if (typeof v === 'number' && Number.isFinite(v)) total += v;
  }
  return total;
}

export async function createCandidateAssessment(ctx: Ctx, input: Record<string, unknown>) {
  const totalScore = computeTotalScore(input);
  const row = await crudCreate(ctx, candidateAssessments, 'candidate_assessment', { ...input, totalScore });
  // Surface the aggregate on the candidate (Access "Recruitment subform" Score).
  if (typeof input.candidateId === 'string' && input.candidateId) {
    await crudUpdate(ctx, candidates, 'candidate', input.candidateId, { score: totalScore });
  }
  return row;
}

export async function updateCandidateAssessment(
  ctx: Ctx,
  id: string,
  values: Record<string, unknown>,
  expectedUpdatedAt?: string | null,
) {
  // Recompute the total from the merged answer set whenever any scored field changes.
  let patch = values;
  if (ASSESSMENT_SCORE_KEYS.some((k) => k in values)) {
    const before = await crudGet(ctx.tx, candidateAssessments, id);
    const merged: Record<string, unknown> = { ...before };
    for (const k of ASSESSMENT_SCORE_KEYS) if (k in values) merged[k] = values[k];
    const totalScore = computeTotalScore(merged);
    patch = { ...values, totalScore };
    await crudUpdate(ctx, candidates, 'candidate', before.candidateId, { score: totalScore });
  }
  return crudUpdate(ctx, candidateAssessments, 'candidate_assessment', id, patch, expectedUpdatedAt);
}

export async function listCandidateAssessments(
  ctx: Ctx,
  input: { candidateId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.candidateId) where.push(eq(candidateAssessments.candidateId, input.candidateId));
  const { items, total } = await crudList(ctx.tx, candidateAssessments, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(candidateAssessments.createdAt),
  });
  return { items, total, page, pageSize };
}

/**
 * Candidate → Employee conversion (Access "Make Employee" action). Creates an
 * `employees` row from the candidate's known fields, flags the candidate as
 * recruited, and returns the new employee id. Idempotent guard: a candidate may
 * only be converted once.
 */
export async function makeEmployeeFromCandidate(
  ctx: Ctx,
  candidateId: string,
  input: { employeeNumber?: unknown } = {},
): Promise<{ employeeId: string; candidateId: string }> {
  const candidate = await crudGet(ctx.tx, candidates, candidateId);
  if (candidate.recruited) throw Errors.conflict('Candidate has already been made an employee.');

  // The latest assessment carries the placement region/department/job title.
  const [assessment] = (await (ctx.tx as any)
    .select()
    .from(candidateAssessments)
    .where(eq(candidateAssessments.candidateId, candidateId))
    .orderBy(asc(candidateAssessments.createdAt))) as Array<typeof candidateAssessments.$inferSelect>;

  const employeeNumber =
    (typeof input.employeeNumber === 'string' && input.employeeNumber.trim()) ||
    `C-${candidateId.slice(0, 8).toUpperCase()}`;

  const employee = await crudCreate(ctx, employees, 'employee', {
    employeeNumber,
    firstName: candidate.firstName,
    surname: candidate.surname,
    email: candidate.email ?? null,
    phoneMobile: candidate.phone ?? null,
    idNumber: candidate.idNumber ?? null,
    eeGroupId: candidate.eeGroupId ?? null,
    gender: assessment?.gender ?? null,
    jobTitleId: assessment?.appliedJobTitleId ?? null,
    departmentId: assessment?.departmentId ?? null,
    regionId: assessment?.regionId ?? null,
    employmentStatus: 'active',
  });

  await crudUpdate(ctx, candidates, 'candidate', candidateId, { recruited: true, status: 'hired' });

  return { employeeId: employee.id, candidateId };
}
