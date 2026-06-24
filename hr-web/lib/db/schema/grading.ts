// MODULE: Salary grading scale — legacy tblGrading (frmGrading / frmGradingReg).
// A pay-scale reference: rate band per Paterson grade/band, occupational level
// and job title. Reference data, not transactional.
import { pgTable, text, doublePrecision, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';

export const grading = pgTable(
  'grading',
  {
    id: pk(),
    scale: text('scale'),
    occLevel: text('occ_level'),
    jobTitle: text('job_title'),
    code: text('code'),
    patersonGrade: text('paterson_grade'),
    patersonBand: text('paterson_band'),
    minRate: doublePrecision('min_rate'),
    maxRate: doublePrecision('max_rate'),
    ...auditColumns,
  },
  (t) => ({
    gradeIdx: index('grading_paterson_grade_idx').on(t.patersonGrade),
  }),
);

export type Grading = typeof grading.$inferSelect;
export type NewGrading = typeof grading.$inferInsert;
