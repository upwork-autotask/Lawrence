import { z } from 'zod';

/* ---------- Shared enums ---------- */

export const TrainingKind = z.enum(['internal', 'external', 'blended']);
export type TrainingKind = z.infer<typeof TrainingKind>;

export const TrainingSessionStatus = z.enum([
  'scheduled', 'in_progress', 'completed', 'failed', 'no_show',
]);
export type TrainingSessionStatus = z.infer<typeof TrainingSessionStatus>;

export const TrainingApprovalStatus = z.enum(['pending', 'approved', 'rejected']);
export type TrainingApprovalStatus = z.infer<typeof TrainingApprovalStatus>;

export const QuizQuestionKind = z.enum(['single_choice', 'multi_choice', 'true_false', 'short_answer']);
export type QuizQuestionKind = z.infer<typeof QuizQuestionKind>;

/* ---------- Trainings catalogue ---------- */

export const TrainingCatalogueFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1, 'Required'),
  kind: TrainingKind,
  provider: z.string().nullish(),
  durationHours: z.number().nonnegative().nullish(),
  cost: z.number().nonnegative().nullish(),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  requiresQuiz: z.boolean().default(false),
});
export type TrainingCatalogueFormValues = z.infer<typeof TrainingCatalogueFormSchema>;

export const TrainingCatalogueRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  kind: TrainingKind,
  provider: z.string().nullable(),
  durationHours: z.number().nullable(),
  cost: z.number().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  requiresQuiz: z.boolean(),
});
export type TrainingCatalogueRow = z.infer<typeof TrainingCatalogueRow>;

export const TrainingCatalogueListRequest = z.object({
  search: z.string().optional(),
  kind: TrainingKind.optional(),
  includeInactive: z.boolean().default(false),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type TrainingCatalogueListRequest = z.infer<typeof TrainingCatalogueListRequest>;

export const TrainingCatalogueListResponse = z.object({
  rows: z.array(TrainingCatalogueRow),
  total: z.number().int().nonnegative(),
});
export type TrainingCatalogueListResponse = z.infer<typeof TrainingCatalogueListResponse>;

export const TrainingCatalogueGetRequest = z.object({ id: z.number().int().positive() });
export const TrainingCatalogueCreateRequest = TrainingCatalogueFormSchema;
export const TrainingCatalogueUpdateRequest = TrainingCatalogueFormSchema.extend({
  id: z.number().int().positive(),
});
export const TrainingCatalogueDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Internal training sessions ---------- */

export const TrainingInternalFormSchema = z.object({
  trainingId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  scheduledDate: z.coerce.date().nullish(),
  startedAt: z.coerce.date().nullish(),
  completedAt: z.coerce.date().nullish(),
  score: z.number().nullish(),
  status: TrainingSessionStatus.default('scheduled'),
  certificatePath: z.string().nullish(),
  notes: z.string().nullish(),
});
export type TrainingInternalFormValues = z.infer<typeof TrainingInternalFormSchema>;

export const TrainingInternalRow = z.object({
  id: z.number().int().positive(),
  trainingId: z.number().int().positive(),
  trainingName: z.string().nullable(),
  trainingKind: TrainingKind.nullable(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  scheduledDate: z.number().nullable(),
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  score: z.number().nullable(),
  status: TrainingSessionStatus,
  certificatePath: z.string().nullable(),
  approvalStatus: TrainingApprovalStatus,
  approvedBy: z.number().int().positive().nullable(),
  approvedAt: z.number().nullable(),
  notes: z.string().nullable(),
});
export type TrainingInternalRow = z.infer<typeof TrainingInternalRow>;

export const TrainingInternalListRequest = z.object({
  search: z.string().optional(),
  status: TrainingSessionStatus.optional(),
  approvalStatus: TrainingApprovalStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  trainingId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type TrainingInternalListRequest = z.infer<typeof TrainingInternalListRequest>;

export const TrainingInternalListResponse = z.object({
  rows: z.array(TrainingInternalRow),
  total: z.number().int().nonnegative(),
});
export type TrainingInternalListResponse = z.infer<typeof TrainingInternalListResponse>;

export const TrainingInternalGetRequest = z.object({ id: z.number().int().positive() });
export const TrainingInternalCreateRequest = TrainingInternalFormSchema;
export const TrainingInternalUpdateRequest = TrainingInternalFormSchema.extend({
  id: z.number().int().positive(),
});
export const TrainingInternalDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- External training sessions ---------- */

export const TrainingExternalFormSchema = z.object({
  trainingId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  providerName: z.string().min(1, 'Required'),
  venue: z.string().nullish(),
  scheduledDate: z.coerce.date().nullish(),
  startedAt: z.coerce.date().nullish(),
  completedAt: z.coerce.date().nullish(),
  score: z.number().nullish(),
  status: TrainingSessionStatus.default('scheduled'),
  certificatePath: z.string().nullish(),
  poNumber: z.string().nullish(),
  cost: z.number().nonnegative().nullish(),
  notes: z.string().nullish(),
});
export type TrainingExternalFormValues = z.infer<typeof TrainingExternalFormSchema>;

export const TrainingExternalRow = z.object({
  id: z.number().int().positive(),
  trainingId: z.number().int().positive(),
  trainingName: z.string().nullable(),
  trainingKind: TrainingKind.nullable(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  providerName: z.string(),
  venue: z.string().nullable(),
  scheduledDate: z.number().nullable(),
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  score: z.number().nullable(),
  status: TrainingSessionStatus,
  certificatePath: z.string().nullable(),
  poNumber: z.string().nullable(),
  cost: z.number().nullable(),
  approvalStatus: TrainingApprovalStatus,
  approvedBy: z.number().int().positive().nullable(),
  approvedAt: z.number().nullable(),
  notes: z.string().nullable(),
});
export type TrainingExternalRow = z.infer<typeof TrainingExternalRow>;

export const TrainingExternalListRequest = z.object({
  search: z.string().optional(),
  status: TrainingSessionStatus.optional(),
  approvalStatus: TrainingApprovalStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  trainingId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type TrainingExternalListRequest = z.infer<typeof TrainingExternalListRequest>;

export const TrainingExternalListResponse = z.object({
  rows: z.array(TrainingExternalRow),
  total: z.number().int().nonnegative(),
});
export type TrainingExternalListResponse = z.infer<typeof TrainingExternalListResponse>;

export const TrainingExternalGetRequest = z.object({ id: z.number().int().positive() });
export const TrainingExternalCreateRequest = TrainingExternalFormSchema;
export const TrainingExternalUpdateRequest = TrainingExternalFormSchema.extend({
  id: z.number().int().positive(),
});
export const TrainingExternalDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Approval (internal + external) ---------- */

export const TrainingApproveRequest = z.object({
  id: z.number().int().positive(),
  kind: z.enum(['internal', 'external']),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().nullish(),
});
export type TrainingApproveRequest = z.infer<typeof TrainingApproveRequest>;

/* ---------- Analysis skills (pipeline) ---------- */

export const AnalysisSkillsFormSchema = z.object({
  trainingInternalId: z.number().int().positive().nullish(),
  trainingExternalId: z.number().int().positive().nullish(),
  employeeId: z.number().int().positive(),
  bookingComplete: z.boolean().default(false),
  approvalComplete: z.boolean().default(false),
  poComplete: z.boolean().default(false),
  startComplete: z.boolean().default(false),
  endComplete: z.boolean().default(false),
  certificateComplete: z.boolean().default(false),
});
export type AnalysisSkillsFormValues = z.infer<typeof AnalysisSkillsFormSchema>;

export const AnalysisSkillsRow = z.object({
  id: z.number().int().positive(),
  trainingInternalId: z.number().int().positive().nullable(),
  trainingExternalId: z.number().int().positive().nullable(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  bookingComplete: z.boolean(),
  approvalComplete: z.boolean(),
  poComplete: z.boolean(),
  startComplete: z.boolean(),
  endComplete: z.boolean(),
  certificateComplete: z.boolean(),
});
export type AnalysisSkillsRow = z.infer<typeof AnalysisSkillsRow>;

export const AnalysisSkillsListRequest = z.object({
  employeeId: z.number().int().positive().optional(),
  trainingInternalId: z.number().int().positive().optional(),
  trainingExternalId: z.number().int().positive().optional(),
});
export type AnalysisSkillsListRequest = z.infer<typeof AnalysisSkillsListRequest>;

export const AnalysisSkillsListResponse = z.object({
  rows: z.array(AnalysisSkillsRow),
});
export type AnalysisSkillsListResponse = z.infer<typeof AnalysisSkillsListResponse>;

export const AnalysisSkillsCreateRequest = AnalysisSkillsFormSchema;
export const AnalysisSkillsUpdateRequest = AnalysisSkillsFormSchema.extend({
  id: z.number().int().positive(),
});
export const AnalysisSkillsDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Quiz questions ---------- */

export const QuizQuestionFormSchema = z.object({
  trainingId: z.number().int().positive(),
  question: z.string().min(1, 'Required'),
  kind: QuizQuestionKind.default('single_choice'),
  points: z.number().nonnegative().default(1),
  sortOrder: z.number().int().default(0),
  explanation: z.string().nullish(),
});
export type QuizQuestionFormValues = z.infer<typeof QuizQuestionFormSchema>;

export const QuizQuestionRow = z.object({
  id: z.number().int().positive(),
  trainingId: z.number().int().positive(),
  question: z.string(),
  kind: QuizQuestionKind,
  points: z.number(),
  sortOrder: z.number().int(),
  explanation: z.string().nullable(),
});
export type QuizQuestionRow = z.infer<typeof QuizQuestionRow>;

export const QuizQuestionListRequest = z.object({
  trainingId: z.number().int().positive(),
});
export type QuizQuestionListRequest = z.infer<typeof QuizQuestionListRequest>;

export const QuizQuestionListResponse = z.object({
  rows: z.array(QuizQuestionRow),
});
export type QuizQuestionListResponse = z.infer<typeof QuizQuestionListResponse>;

export const QuizQuestionCreateRequest = QuizQuestionFormSchema;
export const QuizQuestionUpdateRequest = QuizQuestionFormSchema.extend({
  id: z.number().int().positive(),
});
export const QuizQuestionDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Quiz answers ---------- */

export const QuizAnswerFormSchema = z.object({
  questionId: z.number().int().positive(),
  answerText: z.string().min(1, 'Required'),
  isCorrect: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type QuizAnswerFormValues = z.infer<typeof QuizAnswerFormSchema>;

export const QuizAnswerRow = z.object({
  id: z.number().int().positive(),
  questionId: z.number().int().positive(),
  answerText: z.string(),
  isCorrect: z.boolean(),
  sortOrder: z.number().int(),
});
export type QuizAnswerRow = z.infer<typeof QuizAnswerRow>;

export const QuizAnswerListRequest = z.object({
  questionId: z.number().int().positive(),
});
export type QuizAnswerListRequest = z.infer<typeof QuizAnswerListRequest>;

export const QuizAnswerListResponse = z.object({
  rows: z.array(QuizAnswerRow),
});
export type QuizAnswerListResponse = z.infer<typeof QuizAnswerListResponse>;

export const QuizAnswerCreateRequest = QuizAnswerFormSchema;
export const QuizAnswerUpdateRequest = QuizAnswerFormSchema.extend({
  id: z.number().int().positive(),
});
export const QuizAnswerDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Employee tests ---------- */

export const EmployeeTestFormSchema = z.object({
  trainingInternalId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullish(),
  score: z.number().nullish(),
  percentage: z.number().nullish(),
  passed: z.boolean().nullish(),
  responsesJson: z.string().nullish(),
});
export type EmployeeTestFormValues = z.infer<typeof EmployeeTestFormSchema>;

export const EmployeeTestRow = z.object({
  id: z.number().int().positive(),
  trainingInternalId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
  score: z.number().nullable(),
  percentage: z.number().nullable(),
  passed: z.boolean().nullable(),
  responsesJson: z.string().nullable(),
});
export type EmployeeTestRow = z.infer<typeof EmployeeTestRow>;

export const EmployeeTestListRequest = z.object({
  employeeId: z.number().int().positive().optional(),
  trainingInternalId: z.number().int().positive().optional(),
});
export type EmployeeTestListRequest = z.infer<typeof EmployeeTestListRequest>;

export const EmployeeTestListResponse = z.object({
  rows: z.array(EmployeeTestRow),
});
export type EmployeeTestListResponse = z.infer<typeof EmployeeTestListResponse>;

export const EmployeeTestCreateRequest = EmployeeTestFormSchema;
export const EmployeeTestUpdateRequest = EmployeeTestFormSchema.extend({
  id: z.number().int().positive(),
});
export const EmployeeTestDeleteRequest = z.object({ id: z.number().int().positive() });
