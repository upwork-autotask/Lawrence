import { z } from 'zod';

/* ---------- Shared enums ---------- */

export const DevelopmentPlanStatus = z.enum([
  'draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled',
]);
export type DevelopmentPlanStatus = z.infer<typeof DevelopmentPlanStatus>;

export const ApprovalStatus = z.enum(['pending', 'approved', 'rejected']);
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;

export const ApprovalStep = z.enum(['line_manager', 'hr', 'compliance', 'exco']);
export type ApprovalStep = z.infer<typeof ApprovalStep>;

/* ---------- Development plans ---------- */

export const DevelopmentPlanFormSchema = z.object({
  employeeId: z.number().int().positive(),
  planYear: z.number().int(),
  summary: z.string().nullish(),
  status: DevelopmentPlanStatus.default('draft'),
  lineManagerId: z.number().int().positive().nullish(),
  hrId: z.number().int().positive().nullish(),
  complianceId: z.number().int().positive().nullish(),
  excoId: z.number().int().positive().nullish(),
  targetCompletionDate: z.coerce.date().nullish(),
  completedAt: z.coerce.date().nullish(),
});
export type DevelopmentPlanFormValues = z.infer<typeof DevelopmentPlanFormSchema>;

export const DevelopmentPlanRow = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  planYear: z.number().int(),
  summary: z.string().nullable(),
  status: DevelopmentPlanStatus,
  lineManagerId: z.number().int().positive().nullable(),
  lineManagerStatus: ApprovalStatus,
  lineManagerDecidedAt: z.number().nullable(),
  lineManagerComments: z.string().nullable(),
  hrId: z.number().int().positive().nullable(),
  hrStatus: ApprovalStatus,
  hrDecidedAt: z.number().nullable(),
  hrComments: z.string().nullable(),
  complianceId: z.number().int().positive().nullable(),
  complianceStatus: ApprovalStatus,
  complianceDecidedAt: z.number().nullable(),
  complianceComments: z.string().nullable(),
  excoId: z.number().int().positive().nullable(),
  excoStatus: ApprovalStatus,
  excoDecidedAt: z.number().nullable(),
  excoComments: z.string().nullable(),
  targetCompletionDate: z.number().nullable(),
  completedAt: z.number().nullable(),
});
export type DevelopmentPlanRow = z.infer<typeof DevelopmentPlanRow>;

export const DevelopmentListRequest = z.object({
  search: z.string().optional(),
  status: DevelopmentPlanStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  planYear: z.number().int().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type DevelopmentListRequest = z.infer<typeof DevelopmentListRequest>;

export const DevelopmentListResponse = z.object({
  rows: z.array(DevelopmentPlanRow),
  total: z.number().int().nonnegative(),
});
export type DevelopmentListResponse = z.infer<typeof DevelopmentListResponse>;

export const DevelopmentGetRequest = z.object({ id: z.number().int().positive() });
export type DevelopmentGetRequest = z.infer<typeof DevelopmentGetRequest>;

export const DevelopmentCreateRequest = DevelopmentPlanFormSchema;
export type DevelopmentCreateRequest = z.infer<typeof DevelopmentCreateRequest>;

export const DevelopmentUpdateRequest = DevelopmentPlanFormSchema.extend({
  id: z.number().int().positive(),
});
export type DevelopmentUpdateRequest = z.infer<typeof DevelopmentUpdateRequest>;

export const DevelopmentDeleteRequest = z.object({ id: z.number().int().positive() });
export type DevelopmentDeleteRequest = z.infer<typeof DevelopmentDeleteRequest>;

export const DevelopmentApproveRequest = z.object({
  id: z.number().int().positive(),
  step: ApprovalStep,
  decision: z.enum(['approved', 'rejected']),
  comments: z.string().nullish(),
});
export type DevelopmentApproveRequest = z.infer<typeof DevelopmentApproveRequest>;

/* ---------- Qualifications ---------- */

export const QualDevStatus = z.enum(['planned', 'enrolled', 'in_progress', 'completed', 'withdrawn']);
export type QualDevStatus = z.infer<typeof QualDevStatus>;

export const QualDevFormSchema = z.object({
  planId: z.number().int().positive(),
  qualificationName: z.string().min(1, 'Required'),
  institution: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  targetCompletionDate: z.coerce.date().nullish(),
  completionDate: z.coerce.date().nullish(),
  status: QualDevStatus.default('planned'),
  cost: z.number().nullish(),
  sortOrder: z.number().int().default(0),
  notes: z.string().nullish(),
});
export type QualDevFormValues = z.infer<typeof QualDevFormSchema>;

export const QualDevRow = z.object({
  id: z.number().int().positive(),
  planId: z.number().int().positive(),
  qualificationName: z.string(),
  institution: z.string().nullable(),
  startDate: z.number().nullable(),
  targetCompletionDate: z.number().nullable(),
  completionDate: z.number().nullable(),
  status: QualDevStatus,
  cost: z.number().nullable(),
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
});
export type QualDevRow = z.infer<typeof QualDevRow>;

export const QualDevListRequest = z.object({ planId: z.number().int().positive() });
export type QualDevListRequest = z.infer<typeof QualDevListRequest>;

export const QualDevListResponse = z.object({ rows: z.array(QualDevRow) });
export type QualDevListResponse = z.infer<typeof QualDevListResponse>;

export const QualDevCreateRequest = QualDevFormSchema;
export type QualDevCreateRequest = z.infer<typeof QualDevCreateRequest>;

export const QualDevUpdateRequest = QualDevFormSchema.extend({ id: z.number().int().positive() });
export type QualDevUpdateRequest = z.infer<typeof QualDevUpdateRequest>;

export const QualDevDeleteRequest = z.object({ id: z.number().int().positive() });
export type QualDevDeleteRequest = z.infer<typeof QualDevDeleteRequest>;

/* ---------- Skills ---------- */

export const SkillsDevStatus = z.enum(['planned', 'in_progress', 'achieved', 'withdrawn']);
export type SkillsDevStatus = z.infer<typeof SkillsDevStatus>;

export const SkillsDevFormSchema = z.object({
  planId: z.number().int().positive(),
  skillName: z.string().min(1, 'Required'),
  category: z.string().nullish(),
  currentLevel: z.number().int().min(1).max(5).default(1),
  targetLevel: z.number().int().min(1).max(5).default(3),
  evidence: z.string().nullish(),
  status: SkillsDevStatus.default('planned'),
  sortOrder: z.number().int().default(0),
});
export type SkillsDevFormValues = z.infer<typeof SkillsDevFormSchema>;

export const SkillsDevRow = z.object({
  id: z.number().int().positive(),
  planId: z.number().int().positive(),
  skillName: z.string(),
  category: z.string().nullable(),
  currentLevel: z.number().int(),
  targetLevel: z.number().int(),
  evidence: z.string().nullable(),
  status: SkillsDevStatus,
  sortOrder: z.number().int(),
});
export type SkillsDevRow = z.infer<typeof SkillsDevRow>;

export const SkillsDevListRequest = z.object({ planId: z.number().int().positive() });
export type SkillsDevListRequest = z.infer<typeof SkillsDevListRequest>;

export const SkillsDevListResponse = z.object({ rows: z.array(SkillsDevRow) });
export type SkillsDevListResponse = z.infer<typeof SkillsDevListResponse>;

export const SkillsDevCreateRequest = SkillsDevFormSchema;
export type SkillsDevCreateRequest = z.infer<typeof SkillsDevCreateRequest>;

export const SkillsDevUpdateRequest = SkillsDevFormSchema.extend({ id: z.number().int().positive() });
export type SkillsDevUpdateRequest = z.infer<typeof SkillsDevUpdateRequest>;

export const SkillsDevDeleteRequest = z.object({ id: z.number().int().positive() });
export type SkillsDevDeleteRequest = z.infer<typeof SkillsDevDeleteRequest>;

/* ---------- Experience ---------- */

export const DevExperienceStatus = z.enum(['planned', 'in_progress', 'completed', 'withdrawn']);
export type DevExperienceStatus = z.infer<typeof DevExperienceStatus>;

export const DevExperienceFormSchema = z.object({
  planId: z.number().int().positive(),
  experienceType: z.string().min(1, 'Required'),
  description: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  mentorId: z.number().int().positive().nullish(),
  status: DevExperienceStatus.default('planned'),
  outcome: z.string().nullish(),
  sortOrder: z.number().int().default(0),
});
export type DevExperienceFormValues = z.infer<typeof DevExperienceFormSchema>;

export const DevExperienceRow = z.object({
  id: z.number().int().positive(),
  planId: z.number().int().positive(),
  experienceType: z.string(),
  description: z.string().nullable(),
  startDate: z.number().nullable(),
  endDate: z.number().nullable(),
  mentorId: z.number().int().positive().nullable(),
  status: DevExperienceStatus,
  outcome: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type DevExperienceRow = z.infer<typeof DevExperienceRow>;

export const DevExperienceListRequest = z.object({ planId: z.number().int().positive() });
export type DevExperienceListRequest = z.infer<typeof DevExperienceListRequest>;

export const DevExperienceListResponse = z.object({ rows: z.array(DevExperienceRow) });
export type DevExperienceListResponse = z.infer<typeof DevExperienceListResponse>;

export const DevExperienceCreateRequest = DevExperienceFormSchema;
export type DevExperienceCreateRequest = z.infer<typeof DevExperienceCreateRequest>;

export const DevExperienceUpdateRequest = DevExperienceFormSchema.extend({ id: z.number().int().positive() });
export type DevExperienceUpdateRequest = z.infer<typeof DevExperienceUpdateRequest>;

export const DevExperienceDeleteRequest = z.object({ id: z.number().int().positive() });
export type DevExperienceDeleteRequest = z.infer<typeof DevExperienceDeleteRequest>;
