// MODULE: Performance
// Legacy: TblEmployeePerformence, TblKPI, TblKPICategory.
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

/**
 * KPI categories — top-level grouping of KPIs (e.g. "Financial", "Customer", "Operations").
 * Maps from legacy `TblKPICategory`.
 */
export const kpiCategories = sqliteTable(
  'kpi_categories',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    ...auditColumns,
  },
  (t) => ({
    nameIdx: uniqueIndex('kpi_categories_name_unique').on(t.name),
  }),
);

/**
 * KPI catalogue — measurable performance indicators grouped under categories.
 * Maps from legacy `TblKPI`.
 */
export const kpis = sqliteTable(
  'kpis',
  {
    id: pk(),
    categoryId: integer('category_id').notNull().references(() => kpiCategories.id),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit'),
    targetDirection: text('target_direction', {
      enum: ['higher_better', 'lower_better', 'exact'],
    })
      .notNull()
      .default('higher_better'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    categoryIdx: index('kpis_category_idx').on(t.categoryId),
    nameIdx: uniqueIndex('kpis_name_unique').on(t.name),
  }),
);

/**
 * Per-employee, per-period KPI score with line-manager/HR/EXCO approval ladder.
 * Maps from legacy `TblEmployeePerformence`.
 */
export const employeePerformance = sqliteTable(
  'employee_performance',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    periodYear: integer('period_year').notNull(),
    periodQuarter: integer('period_quarter'),
    periodLabel: text('period_label'),
    kpiId: integer('kpi_id').notNull().references(() => kpis.id),
    targetValue: real('target_value'),
    actualValue: real('actual_value'),
    score: real('score'),
    weight: real('weight').notNull().default(1),
    managerComments: text('manager_comments'),
    employeeComments: text('employee_comments'),
    status: text('status', {
      enum: ['draft', 'submitted', 'reviewed', 'approved', 'disputed'],
    })
      .notNull()
      .default('draft'),

    // Approval ladder
    lineManagerId: integer('line_manager_id'),
    lineManagerDecidedAt: integer('line_manager_decided_at', { mode: 'timestamp_ms' }),
    hrId: integer('hr_id'),
    hrDecidedAt: integer('hr_decided_at', { mode: 'timestamp_ms' }),
    excoDecidedAt: integer('exco_decided_at', { mode: 'timestamp_ms' }),

    ...auditColumns,
  },
  (t) => ({
    employeePeriodIdx: index('employee_performance_employee_period_idx').on(
      t.employeeId,
      t.periodYear,
      t.periodQuarter,
    ),
    statusIdx: index('employee_performance_status_idx').on(t.status),
  }),
);

export type KpiCategory = typeof kpiCategories.$inferSelect;
export type NewKpiCategory = typeof kpiCategories.$inferInsert;
export type Kpi = typeof kpis.$inferSelect;
export type NewKpi = typeof kpis.$inferInsert;
export type EmployeePerformance = typeof employeePerformance.$inferSelect;
export type NewEmployeePerformance = typeof employeePerformance.$inferInsert;
