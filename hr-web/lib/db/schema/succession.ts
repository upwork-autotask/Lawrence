// MODULE: Succession — legacy tblCritical, tblCriticalSkills, tblSuccession, tblSPosition, TblScheme.
import { boolean, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns, lookupColumns } from './common';
import { employees } from './employees';

/** Schemes / talent pools (TblScheme). */
export const successionSchemes = pgTable('succession_schemes', lookupColumns);

/** Critical roles flagged for succession planning (tblCritical + tblSPosition). */
export const criticalRoles = pgTable(
  'critical_roles',
  {
    id: pk(),
    title: text('title').notNull(),
    incumbentEmployeeId: uuid('incumbent_employee_id').references(() => employees.id),
    schemeId: uuid('scheme_id').references(() => successionSchemes.id),
    riskLevel: text('risk_level').notNull().default('medium'), // low|medium|high|critical
    impact: text('impact'),
    reason: text('reason'),
    status: text('status').notNull().default('open'), // open|in_progress|filled|closed
    ...auditColumns,
  },
  (t) => ({ incumbentIdx: index('critical_roles_incumbent_idx').on(t.incumbentEmployeeId) }),
);

/** Skills required for a critical role (tblCriticalSkills). */
export const criticalSkills = pgTable(
  'critical_skills',
  {
    id: pk(),
    criticalRoleId: uuid('critical_role_id').notNull().references(() => criticalRoles.id, { onDelete: 'cascade' }),
    skillName: text('skill_name').notNull(),
    importance: text('importance').notNull().default('important'), // nice_to_have|important|essential
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({ roleIdx: index('critical_skills_role_idx').on(t.criticalRoleId) }),
);

/** Succession candidates for a critical role (tblSuccession + tblSuccAppData). */
export const successionCandidates = pgTable(
  'succession_candidates',
  {
    id: pk(),
    criticalRoleId: uuid('critical_role_id').notNull().references(() => criticalRoles.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    readiness: text('readiness').notNull().default('1_2_years'), // ready_now|1_2_years|3_5_years|long_term
    performanceRating: text('performance_rating'),
    potentialRating: text('potential_rating'),
    developmentNeeds: text('development_needs'),
    isPrimary: boolean('is_primary').notNull().default(false),
    status: text('status').notNull().default('identified'), // identified|developing|ready|appointed|withdrawn
    ...auditColumns,
  },
  (t) => ({ roleIdx: index('succession_candidates_role_idx').on(t.criticalRoleId) }),
);

/** Development commitments per candidate (tblScommitment). */
export const successionCommitments = pgTable(
  'succession_commitments',
  {
    id: pk(),
    candidateId: uuid('candidate_id').notNull().references(() => successionCandidates.id, { onDelete: 'cascade' }),
    commitment: text('commitment').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    status: text('status').notNull().default('pending'), // pending|in_progress|done
    ...auditColumns,
  },
  (t) => ({ candidateIdx: index('succession_commitments_candidate_idx').on(t.candidateId) }),
);

export type CriticalRole = typeof criticalRoles.$inferSelect;
export type CriticalSkill = typeof criticalSkills.$inferSelect;
export type SuccessionCandidate = typeof successionCandidates.$inferSelect;
