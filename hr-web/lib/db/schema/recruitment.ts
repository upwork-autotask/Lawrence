// MODULE: Recruitment — legacy tblRequest, Recruitment, tblInterview, tblEmpInterview,
// tblMainSHeetInterview, tblEvaluation, tblActualRecruitment, tblNonRecruitmentReason,
// tblRecruitmentTarget. Includes the multi-interview-lead junction (the original ask).
import { boolean, doublePrecision, integer, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';
import { departments, regions, jobTitles, eeGroups } from './lookups';

/** Reasons a candidate was not recruited (tblNonRecruitmentReason). */
export const nonRecruitmentReasons = pgTable('non_recruitment_reasons', lookupColumns);

/** Recruitment requisition (tblRequest) with manager + HR approval columns. */
export const recruitmentRequests = pgTable(
  'recruitment_requests',
  {
    id: pk(),
    requestNumber: text('request_number'),
    positionTitle: text('position_title').notNull(),
    jobTitleId: uuid('job_title_id').references(() => jobTitles.id),
    departmentId: uuid('department_id').references(() => departments.id),
    regionId: uuid('region_id').references(() => regions.id),
    headcount: integer('headcount').notNull().default(1),
    motivation: text('motivation'),
    employmentType: text('employment_type'),
    status: text('status').notNull().default('draft'), // draft|approved|advertised|interviewing|filled|cancelled
    managerId: uuid('manager_id'),
    managerStatus: text('manager_status').notNull().default('pending'),
    hrId: uuid('hr_id'),
    hrStatus: text('hr_status').notNull().default('pending'),
    targetStartDate: timestamp('target_start_date', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({ statusIdx: index('recruitment_requests_status_idx').on(t.status) }),
);

/** Candidates / applicants for a requisition. */
export const candidates = pgTable(
  'candidates',
  {
    id: pk(),
    requestId: uuid('request_id').notNull().references(() => recruitmentRequests.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    surname: text('surname').notNull(),
    email: text('email'),
    phone: text('phone'),
    idNumber: text('id_number'),
    eeGroupId: uuid('ee_group_id').references(() => eeGroups.id),
    source: text('source'),
    cvPath: text('cv_path'),
    status: text('status').notNull().default('applied'), // applied|shortlisted|interviewed|offered|hired|rejected
    rejectionReasonId: uuid('rejection_reason_id').references(() => nonRecruitmentReasons.id),
    ...auditColumns,
  },
  (t) => ({ requestIdx: index('candidates_request_idx').on(t.requestId) }),
);

/** Interview events (tblInterview / tblEmpInterview / tblMainSHeetInterview). */
export const interviews = pgTable(
  'interviews',
  {
    id: pk(),
    requestId: uuid('request_id').notNull().references(() => recruitmentRequests.id, { onDelete: 'cascade' }),
    candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    venue: text('venue'),
    stage: text('stage').notNull().default('first'), // screening|first|second|final
    status: text('status').notNull().default('scheduled'), // scheduled|completed|no_show|cancelled
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ candidateIdx: index('interviews_candidate_idx').on(t.candidateId) }),
);

/**
 * Multi-lead interview panel junction. Replaces the single-text "Interviewer Lead"
 * field on the legacy main interview sheet — an interview can have several panel
 * members, one (or more) marked primary.
 */
export const interviewLeads = pgTable(
  'interview_leads',
  {
    id: pk(),
    interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    roleOnPanel: text('role_on_panel'),
    isPrimary: boolean('is_primary').notNull().default(false),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ interviewEmpIdx: uniqueIndex('interview_leads_interview_employee_unique').on(t.interviewId, t.employeeId) }),
);

/** Per-interview candidate evaluation / scoring (tblEvaluation). */
export const evaluations = pgTable(
  'evaluations',
  {
    id: pk(),
    interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
    candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
    evaluatorEmployeeId: uuid('evaluator_employee_id'),
    score: doublePrecision('score'),
    maxScore: doublePrecision('max_score').notNull().default(100),
    strengths: text('strengths'),
    weaknesses: text('weaknesses'),
    recommendation: text('recommendation'), // hire|hold|reject
    ...auditColumns,
  },
  (t) => ({ interviewIdx: index('evaluations_interview_idx').on(t.interviewId) }),
);

/** Interview question bank (tblInterview): scored questions grouped by heading. */
export const interviewQuestions = pgTable(
  'interview_questions',
  {
    id: pk(),
    heading: text('heading'),
    question: text('question').notNull(),
    modelAnswer: text('model_answer'),
    maxScore: doublePrecision('max_score').notNull().default(5),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...auditColumns,
  },
  (t) => ({ headingIdx: index('interview_questions_heading_idx').on(t.heading) }),
);

/** Structured interview scoring sheet (tblEmpInterview): one row per question. */
export const interviewScores = pgTable(
  'interview_scores',
  {
    id: pk(),
    interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').references(() => interviewQuestions.id),
    question: text('question'), // snapshot of the question text
    score: doublePrecision('score'),
    answer: text('answer'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ interviewIdx: index('interview_scores_interview_idx').on(t.interviewId) }),
);

/** EE recruitment targets (tblRecruitmentTarget) — per demographic cell. */
export const recruitmentTargets = pgTable(
  'recruitment_targets',
  {
    id: pk(),
    eeGroupId: uuid('ee_group_id').references(() => eeGroups.id),
    periodYear: integer('period_year').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    occupationalLevel: text('occupational_level'),
    employmentType: text('employment_type'),
    gender: text('gender'),
    race: text('race'),
    targetCount: integer('target_count').notNull().default(0), // Access "Value"
    achievedCount: integer('achieved_count').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ periodIdx: index('recruitment_targets_period_idx').on(t.periodYear) }),
);

/** EE actual-appointment register (tblActualRecruitment) — measured vs targets. */
export const actualRecruitment = pgTable(
  'actual_recruitment',
  {
    id: pk(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    regionId: uuid('region_id').references(() => regions.id),
    departmentId: uuid('department_id').references(() => departments.id),
    name: text('name'),
    surname: text('surname'),
    companyNo: text('company_no'),
    jobTitle: text('job_title'),
    occupationalLevel: text('occupational_level'),
    employmentType: text('employment_type'),
    gender: text('gender'),
    race: text('race'),
    value: integer('value').notNull().default(1),
    reasonForAppointment: text('reason_for_appointment'),
    responsibleExecutive: text('responsible_executive'),
    responsibleManager: text('responsible_manager'),
    progressStatus: text('progress_status'), // appointed | in_progress | pending | …
    reason: text('reason'),
    nonEe: boolean('non_ee').notNull().default(false),
    approval: text('approval'),
    nonRecruitmentReasonId: uuid('non_recruitment_reason_id').references(() => nonRecruitmentReasons.id),
    supportingDocument: text('supporting_document'),
    ...auditColumns,
  },
  (t) => ({ dueIdx: index('actual_recruitment_due_idx').on(t.dueDate) }),
);

export type RecruitmentRequest = typeof recruitmentRequests.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type InterviewLead = typeof interviewLeads.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InterviewScore = typeof interviewScores.$inferSelect;
export type RecruitmentTarget = typeof recruitmentTargets.$inferSelect;
export type ActualRecruitment = typeof actualRecruitment.$inferSelect;
