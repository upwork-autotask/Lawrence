import { and, desc, eq, ilike, inArray, isNull, or, type SQL } from 'drizzle-orm';
import {
  trainingsCatalogue, trainingInternal, trainingExternal,
  quizQuestions, quizAnswers, quizAttempts, quizAttemptAnswers,
} from '../db/schema';
import { crudList, crudCreate, crudGet, crudUpdate } from '../api/crud';
import { Errors } from '../api/errors';
import type { Ctx } from '../api/handler';

export async function listCatalogue(
  ctx: Ctx,
  input: { q?: string; kind?: string; isActive?: boolean; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.kind) where.push(eq(trainingsCatalogue.kind, input.kind));
  if (input.isActive !== undefined) where.push(eq(trainingsCatalogue.isActive, input.isActive));
  if (input.q) {
    const like = `%${input.q}%`;
    where.push(
      or(
        ilike(trainingsCatalogue.name, like),
        ilike(trainingsCatalogue.code, like),
        ilike(trainingsCatalogue.provider, like),
      ) as SQL,
    );
  }
  const { items, total } = await crudList(ctx.tx, trainingsCatalogue, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingsCatalogue.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listInternal(
  ctx: Ctx,
  input: { employeeId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(trainingInternal.employeeId, input.employeeId));
  if (input.status) where.push(eq(trainingInternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, trainingInternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingInternal.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listExternal(
  ctx: Ctx,
  input: { employeeId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(trainingExternal.employeeId, input.employeeId));
  if (input.status) where.push(eq(trainingExternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, trainingExternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(trainingExternal.createdAt),
  });
  return { items, total, page, pageSize };
}

/* ── Test runner (frmResult / subfrmAns weighted scoring) ─────────────────── */

export async function listAttempts(
  ctx: Ctx,
  input: { employeeId?: string; courseId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(quizAttempts.employeeId, input.employeeId));
  if (input.courseId) where.push(eq(quizAttempts.courseId, input.courseId));
  if (input.status) where.push(eq(quizAttempts.status, input.status));
  const { items, total } = await crudList(ctx.tx, quizAttempts, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(quizAttempts.startedAt),
  });
  return { items, total, page, pageSize };
}

/**
 * Start a sitting. If a course is given but `totalQuestions` was not supplied,
 * we count the live questions so the result screen (TotQue) is correct.
 */
export async function startAttempt(ctx: Ctx, input: Record<string, unknown>) {
  let totalQuestions = Number(input.totalQuestions ?? 0);
  const courseId = (input.courseId as string | null | undefined) ?? null;
  if (!totalQuestions && courseId) {
    const rows = await (ctx.tx as any)
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(and(eq(quizQuestions.trainingId, courseId), isNull(quizQuestions.deletedAt)));
    totalQuestions = rows.length;
  }
  return crudCreate(ctx, quizAttempts, 'quiz_attempt', {
    courseId,
    quizId: (input.quizId as string | null | undefined) ?? null,
    employeeId: input.employeeId,
    totalQuestions,
    totalScore: 0,
    status: 'in_progress',
  });
}

/**
 * Grade a submission: persist each selected answer, SUM its `points` (Access
 * subfrmAns weighted scoring — NOT a simple isCorrect count), and stamp the
 * attempt as submitted with the running total.
 */
export async function submitAttempt(
  ctx: Ctx,
  attemptId: string,
  input: {
    answers?: { questionId: string; selectedAnswerId?: unknown }[];
    expectedUpdatedAt?: string | null;
  },
) {
  const attempt = await crudGet(ctx.tx, quizAttempts, attemptId);
  if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).getTime() !== attempt.updatedAt.getTime()) {
    throw Errors.conflict();
  }
  if (attempt.status === 'submitted') throw Errors.conflict('This attempt was already submitted');

  // Normalise the (preprocessed/unknown) selected-answer ids to string|null once.
  const answers = (input.answers ?? []).map((a) => ({
    questionId: a.questionId,
    selectedAnswerId: typeof a.selectedAnswerId === 'string' ? a.selectedAnswerId : null,
  }));
  const selectedIds = answers.map((a) => a.selectedAnswerId).filter((v): v is string => Boolean(v));

  // Resolve the points for every selected answer in one round-trip.
  const pointsById = new Map<string, number>();
  if (selectedIds.length) {
    const rows = await (ctx.tx as any)
      .select({ id: quizAnswers.id, points: quizAnswers.points })
      .from(quizAnswers)
      .where(and(inArray(quizAnswers.id, selectedIds), isNull(quizAnswers.deletedAt)));
    for (const r of rows) pointsById.set(r.id as string, Number(r.points ?? 0));
  }

  // Replace any prior answers for this attempt (idempotent re-submit safety).
  await (ctx.tx as any).delete(quizAttemptAnswers).where(eq(quizAttemptAnswers.attemptId, attemptId));

  let totalScore = 0;
  for (const a of answers) {
    const awarded = a.selectedAnswerId ? pointsById.get(a.selectedAnswerId) ?? 0 : 0;
    totalScore += awarded;
    await (ctx.tx as any).insert(quizAttemptAnswers).values({
      attemptId,
      questionId: a.questionId,
      selectedAnswerId: a.selectedAnswerId ?? null,
      pointsAwarded: awarded,
      createdBy: ctx.actor?.id ?? null,
      updatedBy: ctx.actor?.id ?? null,
    });
  }

  return crudUpdate(ctx, quizAttempts, 'quiz_attempt', attemptId, {
    submittedAt: new Date(),
    totalScore,
    status: 'submitted',
  });
}
