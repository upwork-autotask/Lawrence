import { z } from 'zod';
import { optStr, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

export const PlanCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  planYear: z.coerce.number({ required_error: 'Plan year is required', invalid_type_error: 'Plan year is required' }).int(),
  dateInitiated: optDate,
  summary: optStr,
  // IDP gap analysis (Access main tab)
  requiredStandard: optStr,
  currentLevel: optStr,
  gapIdentified: optStr,
  actionRequired: optStr,
  milestone: optStr,
  measurementCriteria: optStr,
  status: z.string().default('draft'), // draft|submitted|approved|in_progress|completed|cancelled
  targetCompletionDate: optDate,
});

export const PlanUpdate = PlanCreate.partial().extend({ expectedUpdatedAt });

export const PlanListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const QualCreate = z.object({
  planId: z.string().uuid('Plan is required'),
  qualificationName: z.string().min(1, 'Qualification name is required'),
  institution: optStr,
  startDate: optDate,
  targetCompletionDate: optDate,
  completionDate: optDate,
  status: z.string().default('planned'), // planned|enrolled|in_progress|completed|withdrawn
  cost: optNum,
  notes: optStr,
});

export const QualUpdate = QualCreate.partial().extend({ expectedUpdatedAt });

export const QualListQuery = ListQuery.extend({
  planId: z.string().uuid().optional(),
});

export const SkillCreate = z.object({
  planId: z.string().uuid('Plan is required'),
  skillName: z.string().min(1, 'Skill name is required'),
  category: optStr,
  currentLevel: z.coerce.number().int().default(1),
  targetLevel: z.coerce.number().int().default(3),
  evidence: optStr,
  status: z.string().default('planned'), // planned|in_progress|achieved|withdrawn
});

export const SkillUpdate = SkillCreate.partial().extend({ expectedUpdatedAt });

export const SkillListQuery = ListQuery.extend({
  planId: z.string().uuid().optional(),
});

export const DevExpCreate = z.object({
  planId: z.string().uuid('Plan is required'),
  experienceType: z.string().min(1, 'Experience type is required'),
  description: optStr,
  startDate: optDate,
  endDate: optDate,
  status: z.string().default('planned'), // planned|in_progress|completed|withdrawn
  outcome: optStr,
});

export const DevExpUpdate = DevExpCreate.partial().extend({ expectedUpdatedAt });

export const DevExpListQuery = ListQuery.extend({
  planId: z.string().uuid().optional(),
});

export type PlanCreate = z.infer<typeof PlanCreate>;
export type PlanUpdate = z.infer<typeof PlanUpdate>;
export type QualCreate = z.infer<typeof QualCreate>;
export type QualUpdate = z.infer<typeof QualUpdate>;
export type SkillCreate = z.infer<typeof SkillCreate>;
export type SkillUpdate = z.infer<typeof SkillUpdate>;
export type DevExpCreate = z.infer<typeof DevExpCreate>;
export type DevExpUpdate = z.infer<typeof DevExpUpdate>;

/** JSON shapes returned to the client (dates serialise to ISO strings). */
export type DevelopmentPlanRow = {
  id: string;
  employeeId: string;
  planYear: number;
  dateInitiated: string | null;
  summary: string | null;
  requiredStandard: string | null;
  currentLevel: string | null;
  gapIdentified: string | null;
  actionRequired: string | null;
  milestone: string | null;
  measurementCriteria: string | null;
  status: string;
  targetCompletionDate: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type QualDevRow = {
  id: string;
  planId: string;
  qualificationName: string;
  institution: string | null;
  startDate: string | null;
  targetCompletionDate: string | null;
  completionDate: string | null;
  status: string;
  cost: number | null;
  sortOrder: number;
  notes: string | null;
  updatedAt: string;
};

export type SkillsDevRow = {
  id: string;
  planId: string;
  skillName: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  evidence: string | null;
  status: string;
  sortOrder: number;
  updatedAt: string;
};

export type DevExperienceRow = {
  id: string;
  planId: string;
  experienceType: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  outcome: string | null;
  sortOrder: number;
  updatedAt: string;
};
