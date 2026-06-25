// MODULE: Recruitment assessment — the candidate-assessment master (Access
// `FrmRecruitmentForm`). ~25 scored value-list questions (each stored as the
// leading numeric code from its Access value-list) plus the free-text narratives
// and the assessment-report attachment, none of which were modelled on
// `candidates`. `totalScore` is the sum of the scored integer answers.
import { doublePrecision, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { candidates } from './recruitment';
import { regions, departments, jobTitles } from './lookups';

export const candidateAssessments = pgTable(
  'candidate_assessments',
  {
    id: pk(),
    candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
    // ── Header (What position / Region / Department / This Application Is An / Gender) ──
    appliedJobTitleId: uuid('applied_job_title_id').references(() => jobTitles.id),
    regionId: uuid('region_id').references(() => regions.id),
    departmentId: uuid('department_id').references(() => departments.id),
    applicationType: text('application_type'), // Internal Applicant | For Promotion | External Candidate
    gender: text('gender'), // Male | Female

    // ── Scored value-list questions (stored as the leading integer code) ──
    qualificationRelevant: integer('qualification_relevant'), // 3 Yes; 2 Some concepts; 1 No
    yearsExperienceField: integer('years_experience_field'), // 1..5
    yearsExperienceIndustry: integer('years_experience_industry'), // 1..5
    budgetFinanceExperience: integer('budget_finance_experience'), // 2 Yes; 1 No
    managedEmployees: integer('managed_employees'), // 3 Yes; 2 Indirectly; 1 No
    creditCheck: integer('credit_check'), // 3 Passed; 2 Some problem; 1 Failed
    eeGroup: integer('ee_group'), // 3 Black; 2 Women; 1 Disabilities; 0 Previously advantaged
    demographic: integer('demographic'), // 6..1
    meetsEePolicy: integer('meets_ee_policy'), // 2 Yes; 1 No
    computerLiterate: integer('computer_literate'), // 2 Yes; 1 No
    sheqIsoKnowledge: integer('sheq_iso_knowledge'), // 2 Yes; 1 No
    hrSkills: integer('hr_skills'), // 2 Yes; 1 No
    highestQualification: integer('highest_qualification'), // 1..7
    employedBefore: integer('employed_before'), // 2 Yes; 1 No
    abilityToCompleteTask: integer('ability_to_complete_task'), // 1..5
    attendance: integer('attendance'), // 1..5

    // ── Free-text narratives ──
    strengths: text('strengths'),
    weaknesses: text('weaknesses'),
    eeJustification: text('ee_justification'), // "Why isn't this an EE appointment?"
    otherQualifications: text('other_qualifications'),
    companiesWorkedFor: text('companies_worked_for'),
    companyName: text('company_name'),
    referenceRemark: text('reference_remark'),
    homeAddress: text('home_address'),
    phone: text('phone'),

    assessmentReportPath: text('assessment_report_path'), // Access AssesmentReport attachment
    assessedAt: timestamp('assessed_at', { withTimezone: true }), // Access Timestamp
    totalScore: doublePrecision('total_score'), // computed = sum of scored answers
    ...auditColumns,
  },
  (t) => ({ candidateIdx: index('candidate_assessments_candidate_idx').on(t.candidateId) }),
);

export type CandidateAssessment = typeof candidateAssessments.$inferSelect;
