import { z } from 'zod';

/* ---------- KPI categories ---------- */

export const KpiCategoryFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1, 'Required'),
  description: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type KpiCategoryFormValues = z.infer<typeof KpiCategoryFormSchema>;

export const KpiCategoryRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type KpiCategoryRow = z.infer<typeof KpiCategoryRow>;

export const KpiCategoryListRequest = z.object({
  includeInactive: z.boolean().default(false),
});
export type KpiCategoryListRequest = z.infer<typeof KpiCategoryListRequest>;

export const KpiCategoryListResponse = z.object({
  rows: z.array(KpiCategoryRow),
});
export type KpiCategoryListResponse = z.infer<typeof KpiCategoryListResponse>;

export const KpiCategoryCreateRequest = KpiCategoryFormSchema;
export const KpiCategoryUpdateRequest = KpiCategoryFormSchema.extend({
  id: z.number().int().positive(),
});
export const KpiCategoryDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- KPIs ---------- */

export const TargetDirection = z.enum(['higher_better', 'lower_better', 'exact']);
export type TargetDirection = z.infer<typeof TargetDirection>;

export const KpiFormSchema = z.object({
  categoryId: z.number().int().positive(),
  code: z.string().nullish(),
  name: z.string().min(1, 'Required'),
  description: z.string().nullish(),
  unit: z.string().nullish(),
  targetDirection: TargetDirection.default('higher_better'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type KpiFormValues = z.infer<typeof KpiFormSchema>;

export const KpiRow = z.object({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  categoryName: z.string().nullable(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  targetDirection: TargetDirection,
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type KpiRow = z.infer<typeof KpiRow>;

export const KpiListRequest = z.object({
  includeInactive: z.boolean().default(false),
  categoryId: z.number().int().positive().optional(),
});
export type KpiListRequest = z.infer<typeof KpiListRequest>;

export const KpiListResponse = z.object({
  rows: z.array(KpiRow),
});
export type KpiListResponse = z.infer<typeof KpiListResponse>;

export const KpiCreateRequest = KpiFormSchema;
export const KpiUpdateRequest = KpiFormSchema.extend({
  id: z.number().int().positive(),
});
export const KpiDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Employee performance ---------- */

export const PerformanceStatus = z.enum([
  'draft',
  'submitted',
  'reviewed',
  'approved',
  'disputed',
]);
export type PerformanceStatus = z.infer<typeof PerformanceStatus>;

export const PerformanceFormSchema = z.object({
  employeeId: z.number().int().positive(),
  periodYear: z.number().int(),
  periodQuarter: z.number().int().min(1).max(4).nullish(),
  periodLabel: z.string().nullish(),
  kpiId: z.number().int().positive(),
  targetValue: z.number().nullish(),
  actualValue: z.number().nullish(),
  score: z.number().nullish(),
  weight: z.number().nonnegative().default(1),
  managerComments: z.string().nullish(),
  employeeComments: z.string().nullish(),
  status: PerformanceStatus.default('draft'),
  lineManagerId: z.number().int().positive().nullish(),
  hrId: z.number().int().positive().nullish(),
});
export type PerformanceFormValues = z.infer<typeof PerformanceFormSchema>;

export const PerformanceRow = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  periodYear: z.number().int(),
  periodQuarter: z.number().int().nullable(),
  periodLabel: z.string().nullable(),
  kpiId: z.number().int().positive(),
  kpiName: z.string().nullable(),
  categoryId: z.number().int().positive().nullable(),
  categoryName: z.string().nullable(),
  targetValue: z.number().nullable(),
  actualValue: z.number().nullable(),
  score: z.number().nullable(),
  weight: z.number(),
  managerComments: z.string().nullable(),
  employeeComments: z.string().nullable(),
  status: PerformanceStatus,
  lineManagerId: z.number().int().positive().nullable(),
  lineManagerDecidedAt: z.number().nullable(),
  hrId: z.number().int().positive().nullable(),
  hrDecidedAt: z.number().nullable(),
  excoDecidedAt: z.number().nullable(),
});
export type PerformanceRow = z.infer<typeof PerformanceRow>;

export const PerformanceListRequest = z.object({
  search: z.string().optional(),
  status: PerformanceStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  kpiId: z.number().int().positive().optional(),
  periodYear: z.number().int().optional(),
  periodQuarter: z.number().int().min(1).max(4).optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type PerformanceListRequest = z.infer<typeof PerformanceListRequest>;

export const PerformanceListResponse = z.object({
  rows: z.array(PerformanceRow),
  total: z.number().int().nonnegative(),
});
export type PerformanceListResponse = z.infer<typeof PerformanceListResponse>;

export const PerformanceGetRequest = z.object({ id: z.number().int().positive() });
export const PerformanceCreateRequest = PerformanceFormSchema;
export const PerformanceUpdateRequest = PerformanceFormSchema.extend({
  id: z.number().int().positive(),
});
export const PerformanceDeleteRequest = z.object({ id: z.number().int().positive() });

export const PerformanceApproveRequest = z.object({
  id: z.number().int().positive(),
  step: z.enum(['line_manager', 'hr', 'exco']),
  decision: z.enum(['approved', 'disputed']),
  comments: z.string().nullish(),
});
export type PerformanceApproveRequest = z.infer<typeof PerformanceApproveRequest>;
