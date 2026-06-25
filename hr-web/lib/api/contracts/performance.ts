import { z } from 'zod';
import { optStr, optNum, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

/* ── KPI categories (lookup-style) ─────────────────────────────────────── */

export const KpiCategoryCreate = z.object({
  code: optStr,
  name: z.string().min(1, 'Name is required'),
  description: optStr,
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const KpiCategoryUpdate = KpiCategoryCreate.partial().extend({ expectedUpdatedAt });

/* ── KPIs ──────────────────────────────────────────────────────────────── */

export const KpiCreate = z.object({
  categoryId: z.string().uuid('Category is required'),
  code: optStr,
  name: z.string().min(1, 'Name is required'),
  description: optStr,
  unit: optStr,
  targetDirection: z.string().default('higher_better'),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const KpiUpdate = KpiCreate.partial().extend({ expectedUpdatedAt });

export const KpiListQuery = ListQuery.extend({
  categoryId: z.string().uuid().optional(),
});

/* ── Employee performance reviews ──────────────────────────────────────── */

export const PerformanceCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  title: optStr,
  paSetDate: optDate,
  periodYear: z.coerce.number({ required_error: 'Period year is required', invalid_type_error: 'Period year is required' }).int(),
  periodQuarter: optNum,
  periodLabel: optStr,
  kpiId: z.string().uuid('KPI is required'),
  kpiCategory: optStr,
  kpiNotes: optStr,
  targetValue: optNum,
  actualValue: optNum,
  score: optNum,
  percentage: optNum,
  achievementStatus: optStr,
  weight: z.coerce.number().default(1),
  managerComments: optStr,
  employeeComments: optStr,
  reviewDate: optDate,
  reviewedById: optUuid,
  status: z.string().default('draft'),
});

export const PerformanceUpdate = PerformanceCreate.partial().extend({ expectedUpdatedAt });

export const PerformanceListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  periodYear: z.coerce.number().int().optional(),
  status: z.string().optional(),
  kpiCategory: z.string().optional(),
  achievementStatus: z.string().optional(),
});

export type KpiCategoryCreate = z.infer<typeof KpiCategoryCreate>;
export type KpiCategoryUpdate = z.infer<typeof KpiCategoryUpdate>;
export type KpiCreate = z.infer<typeof KpiCreate>;
export type KpiUpdate = z.infer<typeof KpiUpdate>;
export type PerformanceCreate = z.infer<typeof PerformanceCreate>;
export type PerformanceUpdate = z.infer<typeof PerformanceUpdate>;

/* ── JSON shapes returned to the client ────────────────────────────────── */

export type KpiCategoryRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type KpiRow = {
  id: string;
  categoryId: string;
  code: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  targetDirection: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type PerformanceRow = {
  id: string;
  employeeId: string;
  title: string | null;
  paSetDate: string | null;
  periodYear: number;
  periodQuarter: number | null;
  periodLabel: string | null;
  kpiId: string;
  kpiCategory: string | null;
  kpiNotes: string | null;
  targetValue: number | null;
  actualValue: number | null;
  score: number | null;
  percentage: number | null;
  achievementStatus: string | null;
  weight: number;
  managerComments: string | null;
  employeeComments: string | null;
  reviewDate: string | null;
  reviewedById: string | null;
  status: string;
  updatedAt: string;
};
