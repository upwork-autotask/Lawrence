import { z } from 'zod';
import { optStr, optUuid, expectedUpdatedAt, ListQuery } from './common';

/**
 * JD-grading evaluation (Access frmEval). Distinct from the recruitment
 * `evaluations` entity — see schema note. All fields optional/free-text apart
 * from the value-list-backed selects which are stored as text.
 */
export const JdGradeEvalCreate = z.object({
  jobTitleId: optUuid,
  occupationalLevel: optStr,
  factor: optStr,
  assessment: optStr,
  justificationFromJd: optStr,
  additionalPortfolios: optStr,
  gradeImpactReview: optStr,
  recommendedGrading: optStr,
  notes: optStr,
  ceoApproval: optStr,
});

export const JdGradeEvalUpdate = JdGradeEvalCreate.partial().extend({ expectedUpdatedAt });

export const JdGradeEvalListQuery = ListQuery.extend({
  jobTitleId: z.string().uuid().optional(),
  occupationalLevel: z.string().optional(),
  factor: z.string().optional(),
});

export type JdGradeEvalCreate = z.infer<typeof JdGradeEvalCreate>;
export type JdGradeEvalUpdate = z.infer<typeof JdGradeEvalUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type JdGradeEvalRow = {
  id: string;
  jobTitleId: string | null;
  occupationalLevel: string | null;
  factor: string | null;
  assessment: string | null;
  justificationFromJd: string | null;
  additionalPortfolios: string | null;
  gradeImpactReview: string | null;
  recommendedGrading: string | null;
  notes: string | null;
  ceoApproval: string | null;
  updatedAt: string;
};
