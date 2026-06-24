// MODULE: Development — legacy tblDevelopement, tblQualDev, tblSkillsDev, tblDevExp.
// Approval columns (parity): line_manager, hr, compliance, exco.
import { doublePrecision, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

export const developmentPlans = pgTable(
  'development_plans',
  {
    id: pk(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    planYear: integer('plan_year').notNull(),
    dateInitiated: timestamp('date_initiated', { withTimezone: true }),
    summary: text('summary'),
    // IDP gap analysis (Access tblDevelopement main tab)
    requiredStandard: text('required_standard'),
    currentLevel: text('current_level'),
    gapIdentified: text('gap_identified'),
    actionRequired: text('action_required'),
    milestone: text('milestone'),
    measurementCriteria: text('measurement_criteria'),
    status: text('status').notNull().default('draft'), // draft|submitted|approved|in_progress|completed|cancelled

    lineManagerId: uuid('line_manager_id'),
    lineManagerDecidedAt: timestamp('line_manager_decided_at', { withTimezone: true }),
    lineManagerStatus: text('line_manager_status').notNull().default('pending'),
    lineManagerComments: text('line_manager_comments'),

    hrId: uuid('hr_id'),
    hrDecidedAt: timestamp('hr_decided_at', { withTimezone: true }),
    hrStatus: text('hr_status').notNull().default('pending'),
    hrComments: text('hr_comments'),

    complianceId: uuid('compliance_id'),
    complianceDecidedAt: timestamp('compliance_decided_at', { withTimezone: true }),
    complianceStatus: text('compliance_status').notNull().default('pending'),
    complianceComments: text('compliance_comments'),

    excoId: uuid('exco_id'),
    excoDecidedAt: timestamp('exco_decided_at', { withTimezone: true }),
    excoStatus: text('exco_status').notNull().default('pending'),
    excoComments: text('exco_comments'),

    targetCompletionDate: timestamp('target_completion_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({
    employeeYearIdx: index('development_plans_employee_year_idx').on(t.employeeId, t.planYear),
    statusIdx: index('development_plans_status_idx').on(t.status),
  }),
);

export const qualDev = pgTable(
  'qual_dev',
  {
    id: pk(),
    planId: uuid('plan_id').notNull().references(() => developmentPlans.id, { onDelete: 'cascade' }),
    qualificationName: text('qualification_name').notNull(),
    institution: text('institution'),
    startDate: timestamp('start_date', { withTimezone: true }),
    targetCompletionDate: timestamp('target_completion_date', { withTimezone: true }),
    completionDate: timestamp('completion_date', { withTimezone: true }),
    status: text('status').notNull().default('planned'), // planned|enrolled|in_progress|completed|withdrawn
    cost: doublePrecision('cost'),
    sortOrder: integer('sort_order').notNull().default(0),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ planIdx: index('qual_dev_plan_idx').on(t.planId) }),
);

export const skillsDev = pgTable(
  'skills_dev',
  {
    id: pk(),
    planId: uuid('plan_id').notNull().references(() => developmentPlans.id, { onDelete: 'cascade' }),
    skillName: text('skill_name').notNull(),
    category: text('category'),
    currentLevel: integer('current_level').notNull().default(1),
    targetLevel: integer('target_level').notNull().default(3),
    evidence: text('evidence'),
    status: text('status').notNull().default('planned'), // planned|in_progress|achieved|withdrawn
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ planIdx: index('skills_dev_plan_idx').on(t.planId) }),
);

export const devExperience = pgTable(
  'dev_experience',
  {
    id: pk(),
    planId: uuid('plan_id').notNull().references(() => developmentPlans.id, { onDelete: 'cascade' }),
    experienceType: text('experience_type').notNull(),
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    mentorId: uuid('mentor_id'),
    status: text('status').notNull().default('planned'), // planned|in_progress|completed|withdrawn
    outcome: text('outcome'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({ planIdx: index('dev_experience_plan_idx').on(t.planId) }),
);

export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type QualDev = typeof qualDev.$inferSelect;
export type SkillsDev = typeof skillsDev.$inferSelect;
export type DevExperience = typeof devExperience.$inferSelect;
