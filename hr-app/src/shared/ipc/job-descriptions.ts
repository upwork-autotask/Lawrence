import { z } from 'zod';

/* ---------- Job descriptions (master record) ---------- */

export const JobDescriptionStatus = z.enum(['draft', 'active', 'retired']);
export type JobDescriptionStatus = z.infer<typeof JobDescriptionStatus>;

export const JobDescriptionFormSchema = z.object({
  title: z.string().min(1, 'Required'),
  version: z.number().int().positive().default(1),
  status: JobDescriptionStatus.default('draft'),
  summary: z.string().nullish(),
  reportsToTitle: z.string().nullish(),
  preparedBy: z.number().int().positive().nullish(),
  approvedByCeoAt: z.coerce.date().nullish(),
  effectiveDate: z.coerce.date().nullish(),
  retiredDate: z.coerce.date().nullish(),
});
export type JobDescriptionFormValues = z.infer<typeof JobDescriptionFormSchema>;

export const JobDescriptionRow = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  version: z.number().int(),
  status: JobDescriptionStatus,
  summary: z.string().nullable(),
  reportsToTitle: z.string().nullable(),
  preparedBy: z.number().int().positive().nullable(),
  approvedByCeoAt: z.number().nullable(),
  effectiveDate: z.number().nullable(),
  retiredDate: z.number().nullable(),
});
export type JobDescriptionRow = z.infer<typeof JobDescriptionRow>;

export const JobDescriptionListRequest = z.object({
  search: z.string().optional(),
  status: JobDescriptionStatus.optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type JobDescriptionListRequest = z.infer<typeof JobDescriptionListRequest>;

export const JobDescriptionListResponse = z.object({
  rows: z.array(JobDescriptionRow),
  total: z.number().int().nonnegative(),
});
export type JobDescriptionListResponse = z.infer<typeof JobDescriptionListResponse>;

export const JobDescriptionGetRequest = z.object({ id: z.number().int().positive() });
export const JobDescriptionCreateRequest = JobDescriptionFormSchema;
export const JobDescriptionUpdateRequest = JobDescriptionFormSchema.extend({
  id: z.number().int().positive(),
});
export const JobDescriptionDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- JD entries (narrative sections) ---------- */

export const JdEntryFormSchema = z.object({
  jdId: z.number().int().positive(),
  section: z.string().min(1, 'Required'),
  body: z.string().nullish(),
  sortOrder: z.number().int().default(0),
});
export type JdEntryFormValues = z.infer<typeof JdEntryFormSchema>;

export const JdEntryRow = z.object({
  id: z.number().int().positive(),
  jdId: z.number().int().positive(),
  section: z.string(),
  body: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type JdEntryRow = z.infer<typeof JdEntryRow>;

export const JdEntryListRequest = z.object({
  jdId: z.number().int().positive(),
});
export type JdEntryListRequest = z.infer<typeof JdEntryListRequest>;

export const JdEntryListResponse = z.object({
  rows: z.array(JdEntryRow),
});
export type JdEntryListResponse = z.infer<typeof JdEntryListResponse>;

export const JdEntryCreateRequest = JdEntryFormSchema;
export const JdEntryUpdateRequest = JdEntryFormSchema.extend({
  id: z.number().int().positive(),
});
export const JdEntryDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- JD roles & responsibilities ---------- */

export const JdRoleFormSchema = z.object({
  jdId: z.number().int().positive(),
  description: z.string().min(1, 'Required'),
  weight: z.number().nonnegative().default(1),
  sortOrder: z.number().int().default(0),
});
export type JdRoleFormValues = z.infer<typeof JdRoleFormSchema>;

export const JdRoleRow = z.object({
  id: z.number().int().positive(),
  jdId: z.number().int().positive(),
  description: z.string(),
  weight: z.number(),
  sortOrder: z.number().int(),
});
export type JdRoleRow = z.infer<typeof JdRoleRow>;

export const JdRoleListRequest = z.object({
  jdId: z.number().int().positive(),
});
export type JdRoleListRequest = z.infer<typeof JdRoleListRequest>;

export const JdRoleListResponse = z.object({
  rows: z.array(JdRoleRow),
});
export type JdRoleListResponse = z.infer<typeof JdRoleListResponse>;

export const JdRoleCreateRequest = JdRoleFormSchema;
export const JdRoleUpdateRequest = JdRoleFormSchema.extend({
  id: z.number().int().positive(),
});
export const JdRoleDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- JD KPIs ---------- */

export const JdKpiFormSchema = z.object({
  jdId: z.number().int().positive(),
  kpiId: z.number().int().positive().nullish(),
  target: z.string().nullish(),
  weight: z.number().nonnegative().default(1),
  sortOrder: z.number().int().default(0),
});
export type JdKpiFormValues = z.infer<typeof JdKpiFormSchema>;

export const JdKpiRow = z.object({
  id: z.number().int().positive(),
  jdId: z.number().int().positive(),
  kpiId: z.number().int().positive().nullable(),
  target: z.string().nullable(),
  weight: z.number(),
  sortOrder: z.number().int(),
});
export type JdKpiRow = z.infer<typeof JdKpiRow>;

export const JdKpiListRequest = z.object({
  jdId: z.number().int().positive(),
});
export type JdKpiListRequest = z.infer<typeof JdKpiListRequest>;

export const JdKpiListResponse = z.object({
  rows: z.array(JdKpiRow),
});
export type JdKpiListResponse = z.infer<typeof JdKpiListResponse>;

export const JdKpiCreateRequest = JdKpiFormSchema;
export const JdKpiUpdateRequest = JdKpiFormSchema.extend({
  id: z.number().int().positive(),
});
export const JdKpiDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- JD training (internal & external) ---------- */

export const JdTrainingFormSchema = z.object({
  jdId: z.number().int().positive(),
  trainingId: z.number().int().positive().nullish(),
  required: z.boolean().default(false),
  frequency: z.string().nullish(),
  sortOrder: z.number().int().default(0),
});
export type JdTrainingFormValues = z.infer<typeof JdTrainingFormSchema>;

export const JdTrainingRow = z.object({
  id: z.number().int().positive(),
  jdId: z.number().int().positive(),
  trainingId: z.number().int().positive().nullable(),
  required: z.boolean(),
  frequency: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type JdTrainingRow = z.infer<typeof JdTrainingRow>;

export const JdTrainingListRequest = z.object({
  jdId: z.number().int().positive(),
});
export type JdTrainingListRequest = z.infer<typeof JdTrainingListRequest>;

export const JdTrainingListResponse = z.object({
  rows: z.array(JdTrainingRow),
});
export type JdTrainingListResponse = z.infer<typeof JdTrainingListResponse>;

export const JdTrainingCreateRequest = JdTrainingFormSchema;
export const JdTrainingUpdateRequest = JdTrainingFormSchema.extend({
  id: z.number().int().positive(),
});
export const JdTrainingDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Employee JD assignments ---------- */

export const EmployeeJdStatus = z.enum(['assigned', 'acknowledged', 'signed_off']);
export type EmployeeJdStatus = z.infer<typeof EmployeeJdStatus>;

export const EmployeeJdFormSchema = z.object({
  employeeId: z.number().int().positive(),
  jdId: z.number().int().positive(),
  assignedAt: z.coerce.date(),
  lineManagerId: z.number().int().positive().nullish(),
  hrId: z.number().int().positive().nullish(),
  ceoApprovedAt: z.coerce.date().nullish(),
  status: EmployeeJdStatus.default('assigned'),
  notes: z.string().nullish(),
});
export type EmployeeJdFormValues = z.infer<typeof EmployeeJdFormSchema>;

export const EmployeeJdRow = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  jdId: z.number().int().positive(),
  jdTitle: z.string().nullable(),
  jdVersion: z.number().int().nullable(),
  assignedAt: z.number(),
  lineManagerId: z.number().int().positive().nullable(),
  hrId: z.number().int().positive().nullable(),
  ceoApprovedAt: z.number().nullable(),
  status: EmployeeJdStatus,
  notes: z.string().nullable(),
});
export type EmployeeJdRow = z.infer<typeof EmployeeJdRow>;

export const EmployeeJdListRequest = z.object({
  jdId: z.number().int().positive().optional(),
  employeeId: z.number().int().positive().optional(),
  status: EmployeeJdStatus.optional(),
});
export type EmployeeJdListRequest = z.infer<typeof EmployeeJdListRequest>;

export const EmployeeJdListResponse = z.object({
  rows: z.array(EmployeeJdRow),
});
export type EmployeeJdListResponse = z.infer<typeof EmployeeJdListResponse>;

export const EmployeeJdCreateRequest = EmployeeJdFormSchema;
export const EmployeeJdUpdateRequest = EmployeeJdFormSchema.extend({
  id: z.number().int().positive(),
});
export const EmployeeJdDeleteRequest = z.object({ id: z.number().int().positive() });
