// MODULE: Performance — legacy TblEmployeePerformence, TblKPI, TblKPICategory.
import { boolean, doublePrecision, integer, pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

export const kpiCategories = pgTable(
  'kpi_categories',
  {
    id: pk(),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...auditColumns,
  },
  (t) => ({ nameIdx: uniqueIndex('kpi_categories_name_unique').on(t.name) }),
);

export const kpis = pgTable(
  'kpis',
  {
    id: pk(),
    categoryId: uuid('category_id').notNull().references(() => kpiCategories.id),
    code: text('code'),
    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit'),
    targetDirection: text('target_direction').notNull().default('higher_better'), // higher_better|lower_better|exact
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    categoryIdx: index('kpis_category_idx').on(t.categoryId),
    nameIdx: uniqueIndex('kpis_name_unique').on(t.name),
  }),
);

export const employeePerformance = pgTable(
  'employee_performance',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    title: text('title'),
    paSetDate: timestamp('pa_set_date', { withTimezone: true }),
    periodYear: integer('period_year').notNull(),
    periodQuarter: integer('period_quarter'),
    periodLabel: text('period_label'),
    kpiId: uuid('kpi_id').notNull().references(() => kpis.id),
    kpiCategory: text('kpi_category'),
    kpiNotes: text('kpi_notes'),
    targetValue: doublePrecision('target_value'),
    actualValue: doublePrecision('actual_value'),
    score: doublePrecision('score'),
    percentage: doublePrecision('percentage'),
    achievementStatus: text('achievement_status'),
    weight: doublePrecision('weight').notNull().default(1),
    managerComments: text('manager_comments'),
    employeeComments: text('employee_comments'),
    reviewDate: timestamp('review_date', { withTimezone: true }),
    reviewedById: uuid('reviewed_by_id'),
    status: text('status').notNull().default('draft'), // draft|submitted|reviewed|approved|disputed
    lineManagerId: uuid('line_manager_id'),
    lineManagerDecidedAt: timestamp('line_manager_decided_at', { withTimezone: true }),
    hrId: uuid('hr_id'),
    hrDecidedAt: timestamp('hr_decided_at', { withTimezone: true }),
    excoDecidedAt: timestamp('exco_decided_at', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({
    employeePeriodIdx: index('employee_performance_employee_period_idx').on(t.employeeId, t.periodYear, t.periodQuarter),
    statusIdx: index('employee_performance_status_idx').on(t.status),
  }),
);

export type KpiCategory = typeof kpiCategories.$inferSelect;
export type Kpi = typeof kpis.$inferSelect;
export type EmployeePerformance = typeof employeePerformance.$inferSelect;
