import { asc, eq } from 'drizzle-orm';
import { interviewScores } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listInterviewScores(ctx: Ctx, interviewId: string) {
  const { items, total } = await crudList(ctx.tx, interviewScores, {
    where: [eq(interviewScores.interviewId, interviewId)],
    limit: 1000,
    orderBy: asc(interviewScores.sortOrder),
  });
  return { items, total };
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
const num = (v: unknown) => (typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : null);

/** Replace the whole scoring sheet for an interview (delete + re-insert). */
export async function saveInterviewScores(
  ctx: Ctx,
  interviewId: string,
  input: { scores: Array<Record<string, unknown>> },
) {
  const tx = ctx.tx as never as {
    delete: (t: unknown) => { where: (c: unknown) => Promise<unknown> };
    insert: (t: unknown) => { values: (v: unknown) => Promise<unknown> };
  };
  await tx.delete(interviewScores).where(eq(interviewScores.interviewId, interviewId));
  const rows = input.scores.map((s, i) => ({
    interviewId,
    questionId: str(s.questionId),
    question: str(s.question),
    score: num(s.score),
    answer: str(s.answer),
    notes: str(s.notes),
    sortOrder: num(s.sortOrder) ?? i,
    createdBy: ctx.actor?.id ?? null,
    updatedBy: ctx.actor?.id ?? null,
  }));
  if (rows.length) await tx.insert(interviewScores).values(rows);
  await ctx.audit({ action: 'update', entityType: 'interview_scores', entityId: interviewId, after: { count: rows.length } });
  return listInterviewScores(ctx, interviewId);
}
