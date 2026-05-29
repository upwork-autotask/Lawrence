// MODULE: Training
// Legacy: TblAllTrainings, TblEmployeeInternalTrainingDetails, TblEmployeeExternalTrainingDetails,
//         TblAnalysisSkils, tblQue, tblAnswers, tblEmpTest.
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

/**
 * Catalogue of all trainings (internal courses, external programmes, blended).
 * Maps from legacy `TblAllTrainings`.
 */
export const trainingsCatalogue = sqliteTable(
  'trainings_catalogue',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['internal', 'external', 'blended'] }).notNull(),
    provider: text('provider'),
    durationHours: real('duration_hours'),
    cost: real('cost'),
    description: text('description'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    requiresQuiz: integer('requires_quiz', { mode: 'boolean' }).notNull().default(false),
    ...auditColumns,
  },
  (t) => ({
    nameIdx: uniqueIndex('trainings_catalogue_name_unique').on(t.name),
  }),
);

/**
 * Internal training sessions assigned to employees.
 * Maps from legacy `TblEmployeeInternalTrainingDetails`.
 */
export const trainingInternal = sqliteTable(
  'training_internal',
  {
    id: pk(),
    trainingId: integer('training_id').notNull().references(() => trainingsCatalogue.id),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    scheduledDate: integer('scheduled_date', { mode: 'timestamp_ms' }),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    score: real('score'),
    status: text('status', {
      enum: ['scheduled', 'in_progress', 'completed', 'failed', 'no_show'],
    }).notNull().default('scheduled'),
    certificatePath: text('certificate_path'),
    approvalStatus: text('approval_status', {
      enum: ['pending', 'approved', 'rejected'],
    }).notNull().default('pending'),
    approvedBy: integer('approved_by'),
    approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('training_internal_employee_idx').on(t.employeeId),
    statusIdx: index('training_internal_status_idx').on(t.status),
  }),
);

/**
 * External training sessions (sent to outside providers).
 * Maps from legacy `TblEmployeeExternalTrainingDetails`.
 */
export const trainingExternal = sqliteTable(
  'training_external',
  {
    id: pk(),
    trainingId: integer('training_id').notNull().references(() => trainingsCatalogue.id),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    providerName: text('provider_name').notNull(),
    venue: text('venue'),
    scheduledDate: integer('scheduled_date', { mode: 'timestamp_ms' }),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    score: real('score'),
    status: text('status', {
      enum: ['scheduled', 'in_progress', 'completed', 'failed', 'no_show'],
    }).notNull().default('scheduled'),
    certificatePath: text('certificate_path'),
    poNumber: text('po_number'),
    cost: real('cost'),
    approvalStatus: text('approval_status', {
      enum: ['pending', 'approved', 'rejected'],
    }).notNull().default('pending'),
    approvedBy: integer('approved_by'),
    approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('training_external_employee_idx').on(t.employeeId),
    statusIdx: index('training_external_status_idx').on(t.status),
  }),
);

/**
 * Pipeline checkpoints for analysing what stage a training session is at
 * (booking → approval → PO → start → end → certificate).
 * `training_internal_id` / `training_external_id` are mutually exclusive — one is set,
 * the other is null. No FK because they refer to different parent tables.
 * Maps from legacy `TblAnalysisSkils`.
 */
export const analysisSkills = sqliteTable(
  'analysis_skills',
  {
    id: pk(),
    trainingInternalId: integer('training_internal_id'),
    trainingExternalId: integer('training_external_id'),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    bookingComplete: integer('booking_complete', { mode: 'boolean' }).notNull().default(false),
    approvalComplete: integer('approval_complete', { mode: 'boolean' }).notNull().default(false),
    poComplete: integer('po_complete', { mode: 'boolean' }).notNull().default(false),
    startComplete: integer('start_complete', { mode: 'boolean' }).notNull().default(false),
    endComplete: integer('end_complete', { mode: 'boolean' }).notNull().default(false),
    certificateComplete: integer('certificate_complete', { mode: 'boolean' }).notNull().default(false),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('analysis_skills_employee_idx').on(t.employeeId),
  }),
);

/**
 * Quiz questions attached to a training (when `requires_quiz` is set).
 * Maps from legacy `tblQue`.
 */
export const quizQuestions = sqliteTable(
  'quiz_questions',
  {
    id: pk(),
    trainingId: integer('training_id').notNull().references(() => trainingsCatalogue.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    kind: text('kind', {
      enum: ['single_choice', 'multi_choice', 'true_false', 'short_answer'],
    }).notNull().default('single_choice'),
    points: real('points').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    explanation: text('explanation'),
    ...auditColumns,
  },
  (t) => ({
    trainingIdx: index('quiz_questions_training_idx').on(t.trainingId),
  }),
);

/**
 * Candidate answers per question. `is_correct` marks the correct option(s).
 * Maps from legacy `tblAnswers`.
 */
export const quizAnswers = sqliteTable(
  'quiz_answers',
  {
    id: pk(),
    questionId: integer('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
    answerText: text('answer_text').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    questionIdx: index('quiz_answers_question_idx').on(t.questionId),
  }),
);

/**
 * Employee quiz attempts. Recorded responses stored as JSON for replay.
 * Maps from legacy `tblEmpTest`.
 */
export const employeeTests = sqliteTable(
  'employee_tests',
  {
    id: pk(),
    trainingInternalId: integer('training_internal_id').notNull().references(() => trainingInternal.id),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    score: real('score'),
    percentage: real('percentage'),
    passed: integer('passed', { mode: 'boolean' }),
    responsesJson: text('responses_json'),
    ...auditColumns,
  },
  (t) => ({
    employeeIdx: index('employee_tests_employee_idx').on(t.employeeId),
  }),
);

export type TrainingCatalogue = typeof trainingsCatalogue.$inferSelect;
export type NewTrainingCatalogue = typeof trainingsCatalogue.$inferInsert;
export type TrainingInternal = typeof trainingInternal.$inferSelect;
export type NewTrainingInternal = typeof trainingInternal.$inferInsert;
export type TrainingExternal = typeof trainingExternal.$inferSelect;
export type NewTrainingExternal = typeof trainingExternal.$inferInsert;
export type AnalysisSkills = typeof analysisSkills.$inferSelect;
export type NewAnalysisSkills = typeof analysisSkills.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;
export type EmployeeTest = typeof employeeTests.$inferSelect;
export type NewEmployeeTest = typeof employeeTests.$inferInsert;
