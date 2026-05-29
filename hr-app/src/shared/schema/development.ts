// MODULE: Development
// Legacy: tblDevelopement, tblQualDev, tblSkillsDev, tblDevExp.
// Tables: development_plans, qual_dev, skills_dev, dev_experience.
// Approval columns (parity): line_manager, hr, compliance, exco.
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { employees } from './employees';

/**
 * Employee development plan. Approval state stays as columns (line manager, HR,
 * compliance, EXCO), parity with the Access DB.
 * Maps from legacy `tblDevelopement`.
 */
export const developmentPlans = sqliteTable(
  'development_plans',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    planYear: integer('plan_year').notNull(),
    summary: text('summary'),
    status: text('status', {
      enum: ['draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled'],
    })
      .notNull()
      .default('draft'),

    // Line manager step
    lineManagerId: integer('line_manager_id'),
    lineManagerDecidedAt: integer('line_manager_decided_at', { mode: 'timestamp_ms' }),
    lineManagerStatus: text('line_manager_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    lineManagerComments: text('line_manager_comments'),

    // HR step
    hrId: integer('hr_id'),
    hrDecidedAt: integer('hr_decided_at', { mode: 'timestamp_ms' }),
    hrStatus: text('hr_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    hrComments: text('hr_comments'),

    // Compliance step
    complianceId: integer('compliance_id'),
    complianceDecidedAt: integer('compliance_decided_at', { mode: 'timestamp_ms' }),
    complianceStatus: text('compliance_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    complianceComments: text('compliance_comments'),

    // EXCO step
    excoId: integer('exco_id'),
    excoDecidedAt: integer('exco_decided_at', { mode: 'timestamp_ms' }),
    excoStatus: text('exco_status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .notNull()
      .default('pending'),
    excoComments: text('exco_comments'),

    targetCompletionDate: integer('target_completion_date', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),

    ...auditColumns,
  },
  (t) => ({
    employeeYearIdx: index('development_plans_employee_year_idx').on(t.employeeId, t.planYear),
    statusIdx: index('development_plans_status_idx').on(t.status),
  }),
);

/**
 * Qualifications targeted as part of a development plan.
 * Maps from legacy `tblQualDev`.
 */
export const qualDev = sqliteTable(
  'qual_dev',
  {
    id: pk(),
    planId: integer('plan_id')
      .notNull()
      .references(() => developmentPlans.id, { onDelete: 'cascade' }),
    qualificationName: text('qualification_name').notNull(),
    institution: text('institution'),
    startDate: integer('start_date', { mode: 'timestamp_ms' }),
    targetCompletionDate: integer('target_completion_date', { mode: 'timestamp_ms' }),
    completionDate: integer('completion_date', { mode: 'timestamp_ms' }),
    status: text('status', {
      enum: ['planned', 'enrolled', 'in_progress', 'completed', 'withdrawn'],
    })
      .notNull()
      .default('planned'),
    cost: real('cost'),
    sortOrder: integer('sort_order').notNull().default(0),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    planIdx: index('qual_dev_plan_idx').on(t.planId),
  }),
);

/**
 * Skills targeted as part of a development plan.
 * Maps from legacy `tblSkillsDev`.
 */
export const skillsDev = sqliteTable(
  'skills_dev',
  {
    id: pk(),
    planId: integer('plan_id')
      .notNull()
      .references(() => developmentPlans.id, { onDelete: 'cascade' }),
    skillName: text('skill_name').notNull(),
    category: text('category'),
    currentLevel: integer('current_level').notNull().default(1),
    targetLevel: integer('target_level').notNull().default(3),
    evidence: text('evidence'),
    status: text('status', {
      enum: ['planned', 'in_progress', 'achieved', 'withdrawn'],
    })
      .notNull()
      .default('planned'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    planIdx: index('skills_dev_plan_idx').on(t.planId),
  }),
);

/**
 * Experience / exposure activities tied to a development plan (rotations,
 * mentoring, secondments, projects).
 * Maps from legacy `tblDevExp`.
 */
export const devExperience = sqliteTable(
  'dev_experience',
  {
    id: pk(),
    planId: integer('plan_id')
      .notNull()
      .references(() => developmentPlans.id, { onDelete: 'cascade' }),
    experienceType: text('experience_type').notNull(),
    description: text('description'),
    startDate: integer('start_date', { mode: 'timestamp_ms' }),
    endDate: integer('end_date', { mode: 'timestamp_ms' }),
    // Mentor is an employee id, but we deliberately do NOT enforce the FK here
    // to avoid a cycle with the employees hub during seed/migration.
    mentorId: integer('mentor_id'),
    status: text('status', {
      enum: ['planned', 'in_progress', 'completed', 'withdrawn'],
    })
      .notNull()
      .default('planned'),
    outcome: text('outcome'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...auditColumns,
  },
  (t) => ({
    planIdx: index('dev_experience_plan_idx').on(t.planId),
  }),
);

export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type NewDevelopmentPlan = typeof developmentPlans.$inferInsert;
export type QualDev = typeof qualDev.$inferSelect;
export type NewQualDev = typeof qualDev.$inferInsert;
export type SkillsDev = typeof skillsDev.$inferSelect;
export type NewSkillsDev = typeof skillsDev.$inferInsert;
export type DevExperience = typeof devExperience.$inferSelect;
export type NewDevExperience = typeof devExperience.$inferInsert;
