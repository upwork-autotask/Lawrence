import { z } from 'zod';
import { optStr, optNum, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

/* ── Catalogue (trainings_catalogue) ─────────────────────────────────────── */

export const TrainingCreate = z.object({
  code: optStr,
  name: z.string().min(1, 'Name is required'),
  kind: z.enum(['internal', 'external', 'blended'], {
    required_error: 'Kind is required',
    invalid_type_error: 'Kind is required',
  }),
  provider: optStr,
  durationHours: optNum,
  cost: optNum,
  description: optStr,
  isActive: z.coerce.boolean().default(true),
  requiresQuiz: z.coerce.boolean().default(false),
});

export const TrainingUpdate = TrainingCreate.partial().extend({ expectedUpdatedAt });

export const TrainingListQuery = ListQuery.extend({
  kind: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

/* ── Internal assignment (training_internal) ─────────────────────────────── */

export const TrainingInternalCreate = z.object({
  trainingId: z.string().uuid('Training is required'),
  employeeId: z.string().uuid('Employee is required'),
  scheduledDate: optDate,
  startedAt: optDate,
  completedAt: optDate,
  score: optNum,
  status: z.string().default('scheduled'),
  certificatePath: optStr,
  approvalStatus: z.string().default('pending'),
  notes: optStr,
});

export const TrainingInternalUpdate = TrainingInternalCreate.partial().extend({ expectedUpdatedAt });

export const TrainingInternalListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
});

/* ── External assignment (training_external) ─────────────────────────────── */

export const TrainingExternalCreate = z.object({
  trainingId: z.string().uuid('Training is required'),
  employeeId: z.string().uuid('Employee is required'),
  providerName: z.string().min(1, 'Provider name is required'),
  venue: optStr,
  scheduledDate: optDate,
  startedAt: optDate,
  completedAt: optDate,
  score: optNum,
  status: z.string().default('scheduled'),
  certificatePath: optStr,
  poNumber: optStr,
  cost: optNum,
  approvalStatus: z.string().default('pending'),
  notes: optStr,
});

export const TrainingExternalUpdate = TrainingExternalCreate.partial().extend({ expectedUpdatedAt });

export const TrainingExternalListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
});

/* ── Analysis skills (analysis_skills) ───────────────────────────────────── */

export const AnalysisSkillCreate = z.object({
  trainingInternalId: z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable().optional()),
  trainingExternalId: z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable().optional()),
  employeeId: z.string().uuid('Employee is required'),
  bookingComplete: z.coerce.boolean().default(false),
  approvalComplete: z.coerce.boolean().default(false),
  poComplete: z.coerce.boolean().default(false),
  startComplete: z.coerce.boolean().default(false),
  endComplete: z.coerce.boolean().default(false),
  certificateComplete: z.coerce.boolean().default(false),
});

export const AnalysisSkillUpdate = AnalysisSkillCreate.partial().extend({ expectedUpdatedAt });

export const AnalysisSkillListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
});

/* ── Quiz questions (quiz_questions) ─────────────────────────────────────── */

export const QuizQuestionCreate = z.object({
  trainingId: z.string().uuid('Training is required'),
  question: z.string().min(1, 'Question is required'),
  kind: z.string().default('single_choice'),
  points: z.coerce.number().default(1),
  sortOrder: z.coerce.number().int().default(0),
  explanation: optStr,
});

export const QuizQuestionUpdate = QuizQuestionCreate.partial().extend({ expectedUpdatedAt });

export const QuizQuestionListQuery = ListQuery.extend({
  trainingId: z.string().uuid().optional(),
});

/* ── Quiz answers (quiz_answers) ─────────────────────────────────────────── */

export const QuizAnswerCreate = z.object({
  questionId: z.string().uuid('Question is required'),
  answerText: z.string().min(1, 'Answer text is required'),
  isCorrect: z.coerce.boolean().default(false),
  // Weighted per-answer score (Access subfrmAns.Points); summed by the test runner.
  points: z.coerce.number().int().default(0),
  sortOrder: z.coerce.number().int().default(0),
});

export const QuizAnswerUpdate = QuizAnswerCreate.partial().extend({ expectedUpdatedAt });

export const QuizAnswerListQuery = ListQuery.extend({
  questionId: z.string().uuid().optional(),
});

/* ── Employee tests (employee_tests) ─────────────────────────────────────── */

export const EmployeeTestCreate = z.object({
  trainingInternalId: z.string().uuid('Training assignment is required'),
  employeeId: z.string().uuid('Employee is required'),
  startedAt: z.coerce.date({ required_error: 'Started at is required', invalid_type_error: 'Started at is required' }),
  completedAt: optDate,
  score: optNum,
  percentage: optNum,
  passed: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.boolean().nullable().optional()),
  responsesJson: optStr,
});

export const EmployeeTestUpdate = EmployeeTestCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeTestListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  trainingInternalId: z.string().uuid().optional(),
});

export type TrainingCreate = z.infer<typeof TrainingCreate>;
export type TrainingUpdate = z.infer<typeof TrainingUpdate>;
export type TrainingInternalCreate = z.infer<typeof TrainingInternalCreate>;
export type TrainingInternalUpdate = z.infer<typeof TrainingInternalUpdate>;
export type TrainingExternalCreate = z.infer<typeof TrainingExternalCreate>;
export type TrainingExternalUpdate = z.infer<typeof TrainingExternalUpdate>;

/* ── JSON row shapes returned to the client (dates → ISO strings) ────────── */

export type TrainingRow = {
  id: string;
  code: string | null;
  name: string;
  kind: string;
  provider: string | null;
  durationHours: number | null;
  cost: number | null;
  description: string | null;
  isActive: boolean;
  requiresQuiz: boolean;
  updatedAt: string;
};

export type TrainingInternalRow = {
  id: string;
  trainingId: string;
  employeeId: string;
  scheduledDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  status: string;
  certificatePath: string | null;
  approvalStatus: string;
  notes: string | null;
  updatedAt: string;
};

export type TrainingExternalRow = {
  id: string;
  trainingId: string;
  employeeId: string;
  providerName: string;
  venue: string | null;
  scheduledDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  status: string;
  certificatePath: string | null;
  poNumber: string | null;
  cost: number | null;
  approvalStatus: string;
  notes: string | null;
  updatedAt: string;
};

export type QuizQuestionCreate = z.infer<typeof QuizQuestionCreate>;
export type QuizQuestionUpdate = z.infer<typeof QuizQuestionUpdate>;
export type QuizAnswerCreate = z.infer<typeof QuizAnswerCreate>;
export type QuizAnswerUpdate = z.infer<typeof QuizAnswerUpdate>;

export type QuizQuestionRow = {
  id: string;
  trainingId: string;
  question: string;
  kind: string;
  points: number;
  sortOrder: number;
  explanation: string | null;
  updatedAt: string;
};

export type QuizAnswerRow = {
  id: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  points: number;
  sortOrder: number;
  updatedAt: string;
};

/* ── Quiz attempts / test runner (quiz_attempts, quiz_attempt_answers) ────── */

export const QuizAttemptCreate = z.object({
  courseId: optUuid,
  quizId: optUuid,
  employeeId: z.string().uuid('Employee is required'),
  totalQuestions: z.coerce.number().int().default(0),
});

export const QuizAttemptUpdate = QuizAttemptCreate.partial().extend({ expectedUpdatedAt });

export const QuizAttemptListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: z.string().optional(),
});

/** Body for POST /api/quiz-attempts/:id/submit — the candidate's selections. */
export const QuizAttemptSubmit = z.object({
  expectedUpdatedAt,
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid('Question is required'),
        selectedAnswerId: z.preprocess(
          (v) => (v === '' || v === undefined ? null : v),
          z.string().uuid().nullable().optional(),
        ),
      }),
    )
    .default([]),
});

export type QuizAttemptCreate = z.infer<typeof QuizAttemptCreate>;
export type QuizAttemptUpdate = z.infer<typeof QuizAttemptUpdate>;
export type QuizAttemptSubmit = z.infer<typeof QuizAttemptSubmit>;

export type QuizAttemptRow = {
  id: string;
  quizId: string | null;
  courseId: string | null;
  employeeId: string;
  startedAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  totalScore: number;
  status: string;
  updatedAt: string;
};

export type QuizAttemptAnswerRow = {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswerId: string | null;
  pointsAwarded: number;
  updatedAt: string;
};
