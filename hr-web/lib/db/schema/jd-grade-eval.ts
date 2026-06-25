// MODULE: JD-grading evaluation — legacy frmEval / frmEvalReg.
// NOTE the NAME COLLISION: the web already has an unrelated `evaluations`
// recruitment entity. This is a different thing — a job-description grading
// evaluation — so the table is `jd_grade_evaluations` and the route is
// /jd-grade-evaluations to avoid clashing with that recruitment entity.
import { pgTable, text, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { jobTitles } from './lookups';

export const jdGradeEvaluations = pgTable(
  'jd_grade_evaluations',
  {
    id: pk(),
    jobTitleId: uuid('job_title_id').references(() => jobTitles.id), // frmEval JobTitle
    occupationalLevel: text('occupational_level'), // Occuational Level (tblOccLevel)
    factor: text('factor'), // Factor value-list
    assessment: text('assessment'), // Assessment
    justificationFromJd: text('justification_from_jd'), // Justification from JD
    additionalPortfolios: text('additional_portfolios'), // Additional Portfolios / Expanded Scope
    gradeImpactReview: text('grade_impact_review'), // Grade Impact Review
    recommendedGrading: text('recommended_grading'), // Recommended JD Grading
    notes: text('notes'), // Notes
    ceoApproval: text('ceo_approval'), // CEOapproval (Yes/No)
    ...auditColumns,
  },
  (t) => ({
    jobTitleIdx: index('jd_grade_evaluations_job_title_idx').on(t.jobTitleId),
  }),
);

export type JdGradeEvaluation = typeof jdGradeEvaluations.$inferSelect;
export type NewJdGradeEvaluation = typeof jdGradeEvaluations.$inferInsert;
