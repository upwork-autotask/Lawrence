import { desc, eq, sql, type SQL } from 'drizzle-orm';
// Imported directly from the schema file: this table is net-new and the schema
// barrel (lib/db/schema/index.ts) is not edited as part of this feature.
import { jdGradeEvaluations } from '../db/schema/jd-grade-eval';
import { crudList, crudCreate, crudUpdate } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function createJdGradeEval(ctx: Ctx, input: Record<string, unknown>) {
  return crudCreate(ctx, jdGradeEvaluations, 'jd_grade_evaluation', input);
}

export async function updateJdGradeEval(
  ctx: Ctx,
  id: string,
  values: Record<string, unknown>,
  expectedUpdatedAt?: string | null,
) {
  return crudUpdate(ctx, jdGradeEvaluations, 'jd_grade_evaluation', id, values, expectedUpdatedAt);
}

export async function listJdGradeEvals(
  ctx: Ctx,
  input: {
    jobTitleId?: string;
    occupationalLevel?: string;
    factor?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.jobTitleId) where.push(eq(jdGradeEvaluations.jobTitleId, input.jobTitleId));
  if (input.occupationalLevel) where.push(eq(jdGradeEvaluations.occupationalLevel, input.occupationalLevel));
  if (input.factor) where.push(eq(jdGradeEvaluations.factor, input.factor));
  if (input.q) {
    where.push(
      sql`(${jdGradeEvaluations.assessment} ilike ${'%' + input.q + '%'} or ${jdGradeEvaluations.recommendedGrading} ilike ${'%' + input.q + '%'} or ${jdGradeEvaluations.notes} ilike ${'%' + input.q + '%'})`,
    );
  }
  const { items, total } = await crudList(ctx.tx, jdGradeEvaluations, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(jdGradeEvaluations.createdAt),
  });
  return { items, total, page, pageSize };
}
