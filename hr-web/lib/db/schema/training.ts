// MODULE: Training — legacy TblAllTrainings, internal/external details, TblAnalysisSkils, quiz pipeline.
import { boolean, doublePrecision, integer, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

export const trainingsCatalogue = pgTable(
  'trainings_catalogue',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    kind: text('kind').notNull(), // internal|external|blended
    provider: text('provider'),
    durationHours: doublePrecision('duration_hours'),
    cost: doublePrecision('cost'),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    requiresQuiz: boolean('requires_quiz').notNull().default(false),
    ...auditColumns,
  },
  (t) => ({ nameIdx: uniqueIndex('trainings_catalogue_name_unique').on(t.name) }),
);

export const trainingInternal = pgTable(
  'training_internal',
  {
    id: pk(),
    trainingId: uuid('training_id').notNull().references(() => trainingsCatalogue.id),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    score: doublePrecision('score'),
    status: text('status').notNull().default('scheduled'), // scheduled|in_progress|completed|failed|no_show
    certificatePath: text('certificate_path'),
    approvalStatus: text('approval_status').notNull().default('pending'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('training_internal_employee_idx').on(t.employeeId),
    statusIdx: index('training_internal_status_idx').on(t.status),
  }),
);

export const trainingExternal = pgTable(
  'training_external',
  {
    id: pk(),
    trainingId: uuid('training_id').notNull().references(() => trainingsCatalogue.id),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    providerName: text('provider_name').notNull(),
    venue: text('venue'),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    score: doublePrecision('score'),
    status: text('status').notNull().default('scheduled'),
    certificatePath: text('certificate_path'),
    poNumber: text('po_number'),
    cost: doublePrecision('cost'),
    approvalStatus: text('approval_status').notNull().default('pending'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('training_external_employee_idx').on(t.employeeId),
    statusIdx: index('training_external_status_idx').on(t.status),
  }),
);

export const analysisSkills = pgTable(
  'analysis_skills',
  {
    id: pk(),
    trainingInternalId: uuid('training_internal_id'),
    trainingExternalId: uuid('training_external_id'),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    bookingComplete: boolean('booking_complete').notNull().default(false),
    approvalComplete: boolean('approval_complete').notNull().default(false),
    poComplete: boolean('po_complete').notNull().default(false),
    startComplete: boolean('start_complete').notNull().default(false),
    endComplete: boolean('end_complete').notNull().default(false),
    certificateComplete: boolean('certificate_complete').notNull().default(false),
    ...auditColumns,
  },
  (t) => ({ employeeIdx: index('analysis_skills_employee_idx').on(t.employeeId) }),
);

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: pk(),
    trainingId: uuid('training_id').notNull().references(() => trainingsCatalogue.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    kind: text('kind').notNull().default('single_choice'), // single_choice|multi_choice|true_false|short_answer
    points: doublePrecision('points').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    explanation: text('explanation'),
    ...auditColumns,
  },
  (t) => ({ trainingIdx: index('quiz_questions_training_idx').on(t.trainingId) }),
);

export const quizAnswers = pgTable(
  'quiz_answers',
  {
    id: pk(),
    questionId: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
    answerText: text('answer_text').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    // Per-answer weighted score (Access subfrmAns.Points). The test runner SUMS the
    // points of the answers a candidate selects, rather than just counting isCorrect.
    points: integer('points').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ questionIdx: index('quiz_answers_question_idx').on(t.questionId) }),
);

export const employeeTests = pgTable(
  'employee_tests',
  {
    id: pk(),
    trainingInternalId: uuid('training_internal_id').notNull().references(() => trainingInternal.id),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    score: doublePrecision('score'),
    percentage: doublePrecision('percentage'),
    passed: boolean('passed'),
    responsesJson: text('responses_json'),
    ...auditColumns,
  },
  (t) => ({ employeeIdx: index('employee_tests_employee_idx').on(t.employeeId) }),
);

/**
 * Test-runner attempt header (Access frmResult). One row per candidate sitting a
 * course quiz; `totalScore` is the SUM of selected-answer points after grading.
 */
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: pk(),
    quizId: uuid('quiz_id'),
    courseId: uuid('course_id').references(() => trainingsCatalogue.id),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    totalQuestions: integer('total_questions').notNull().default(0),
    totalScore: doublePrecision('total_score').notNull().default(0),
    status: text('status').notNull().default('in_progress'), // in_progress|submitted
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('quiz_attempts_employee_idx').on(t.employeeId),
    courseIdx: index('quiz_attempts_course_idx').on(t.courseId),
    statusIdx: index('quiz_attempts_status_idx').on(t.status),
  }),
);

/** One row per answered question within an attempt (Access subfrmAns selection). */
export const quizAttemptAnswers = pgTable(
  'quiz_attempt_answers',
  {
    id: pk(),
    attemptId: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => quizQuestions.id),
    selectedAnswerId: uuid('selected_answer_id').references(() => quizAnswers.id),
    pointsAwarded: doublePrecision('points_awarded').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    attemptIdx: index('quiz_attempt_answers_attempt_idx').on(t.attemptId),
    questionIdx: index('quiz_attempt_answers_question_idx').on(t.questionId),
  }),
);

export type TrainingCatalogue = typeof trainingsCatalogue.$inferSelect;
export type TrainingInternal = typeof trainingInternal.$inferSelect;
export type TrainingExternal = typeof trainingExternal.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAttemptAnswer = typeof quizAttemptAnswers.$inferSelect;
