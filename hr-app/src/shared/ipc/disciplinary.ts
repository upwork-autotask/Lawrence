import { z } from 'zod';

export const DisciplinaryStatus = z.enum([
  'open',
  'under_investigation',
  'hearing_scheduled',
  'closed',
  'withdrawn',
]);
export type DisciplinaryStatus = z.infer<typeof DisciplinaryStatus>;

// ---------- Disciplinary cases ----------

export const DisciplinaryCaseFormSchema = z.object({
  caseNumber: z.string().min(1, 'Required'),
  employeeId: z.number().int().positive(),
  offenceId: z.number().int().positive(),
  actionId: z.number().int().positive().nullish(),
  incidentDate: z.coerce.date(),
  reportedDate: z.coerce.date(),
  reportedBy: z.number().int().positive().nullish(),
  description: z.string().min(1, 'Required'),
  status: DisciplinaryStatus.default('open'),
  hearingDate: z.coerce.date().nullish(),
  outcome: z.string().nullish(),
  witnesses: z.string().nullish(),
  evidencePath: z.string().nullish(),
  criminalReferral: z.boolean().default(false),
  closedDate: z.coerce.date().nullish(),
  closedBy: z.number().int().positive().nullish(),
});
export type DisciplinaryCaseFormValues = z.infer<typeof DisciplinaryCaseFormSchema>;

export const DisciplinaryListRequest = z.object({
  search: z.string().optional(),
  status: DisciplinaryStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  offenceId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type DisciplinaryListRequest = z.infer<typeof DisciplinaryListRequest>;

export const DisciplinaryRow = z.object({
  id: z.number().int().positive(),
  caseNumber: z.string(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  offenceId: z.number().int().positive(),
  offenceName: z.string(),
  actionId: z.number().int().positive().nullable(),
  actionName: z.string().nullable(),
  incidentDate: z.number(),
  reportedDate: z.number(),
  reportedBy: z.number().int().positive().nullable(),
  description: z.string(),
  status: DisciplinaryStatus,
  hearingDate: z.number().nullable(),
  outcome: z.string().nullable(),
  witnesses: z.string().nullable(),
  evidencePath: z.string().nullable(),
  criminalReferral: z.boolean(),
  closedDate: z.number().nullable(),
  closedBy: z.number().int().positive().nullable(),
});
export type DisciplinaryRow = z.infer<typeof DisciplinaryRow>;

export const DisciplinaryListResponse = z.object({
  rows: z.array(DisciplinaryRow),
  total: z.number().int().nonnegative(),
});
export type DisciplinaryListResponse = z.infer<typeof DisciplinaryListResponse>;

export const DisciplinaryGetRequest = z.object({ id: z.number().int().positive() });
export const DisciplinaryCreateRequest = DisciplinaryCaseFormSchema;
export const DisciplinaryUpdateRequest = DisciplinaryCaseFormSchema.extend({
  id: z.number().int().positive(),
});
export const DisciplinaryDeleteRequest = z.object({ id: z.number().int().positive() });

// ---------- Nature of offence ----------

export const NatureOfOffenceFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type NatureOfOffenceFormValues = z.infer<typeof NatureOfOffenceFormSchema>;

export const NatureOfOffenceRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type NatureOfOffenceRow = z.infer<typeof NatureOfOffenceRow>;

export const NatureOfOffenceListRequest = z.object({
  includeInactive: z.boolean().default(false),
});
export const NatureOfOffenceListResponse = z.object({
  rows: z.array(NatureOfOffenceRow),
});
export type NatureOfOffenceListResponse = z.infer<typeof NatureOfOffenceListResponse>;
export const NatureOfOffenceCreateRequest = NatureOfOffenceFormSchema;
export const NatureOfOffenceUpdateRequest = NatureOfOffenceFormSchema.extend({
  id: z.number().int().positive(),
});
export const NatureOfOffenceDeleteRequest = z.object({ id: z.number().int().positive() });

// ---------- Disciplinary actions ----------

export const DisciplinaryActionFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type DisciplinaryActionFormValues = z.infer<typeof DisciplinaryActionFormSchema>;

export const DisciplinaryActionRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type DisciplinaryActionRow = z.infer<typeof DisciplinaryActionRow>;

export const DisciplinaryActionListRequest = z.object({
  includeInactive: z.boolean().default(false),
});
export const DisciplinaryActionListResponse = z.object({
  rows: z.array(DisciplinaryActionRow),
});
export type DisciplinaryActionListResponse = z.infer<typeof DisciplinaryActionListResponse>;
export const DisciplinaryActionCreateRequest = DisciplinaryActionFormSchema;
export const DisciplinaryActionUpdateRequest = DisciplinaryActionFormSchema.extend({
  id: z.number().int().positive(),
});
export const DisciplinaryActionDeleteRequest = z.object({ id: z.number().int().positive() });

// ---------- Criminal reports ----------

export const CriminalReportFormSchema = z.object({
  caseId: z.number().int().positive(),
  reportedTo: z.string().min(1, 'Required'),
  reportNumber: z.string().nullish(),
  reportedDate: z.coerce.date(),
  status: z.string().nullish(),
  notes: z.string().nullish(),
});
export type CriminalReportFormValues = z.infer<typeof CriminalReportFormSchema>;

export const CriminalReportRow = z.object({
  id: z.number().int().positive(),
  caseId: z.number().int().positive(),
  reportedTo: z.string(),
  reportNumber: z.string().nullable(),
  reportedDate: z.number(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
});
export type CriminalReportRow = z.infer<typeof CriminalReportRow>;

export const CriminalReportListRequest = z.object({
  caseId: z.number().int().positive(),
});
export const CriminalReportListResponse = z.object({
  rows: z.array(CriminalReportRow),
});
export type CriminalReportListResponse = z.infer<typeof CriminalReportListResponse>;
export const CriminalReportCreateRequest = CriminalReportFormSchema;
export const CriminalReportUpdateRequest = CriminalReportFormSchema.extend({
  id: z.number().int().positive(),
});
export const CriminalReportDeleteRequest = z.object({ id: z.number().int().positive() });
