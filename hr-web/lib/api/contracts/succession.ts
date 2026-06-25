import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

export const SchemeCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const SchemeUpdate = SchemeCreate.partial().extend({ expectedUpdatedAt });

export const CriticalRoleCreate = z.object({
  title: z.string().min(1, 'Title is required'),
  refNo: optStr,
  lastReviewDate: optDate,
  incumbentEmployeeId: optUuid,
  successorIdentifiedId: optUuid,
  schemeId: optUuid,
  regionId: optUuid,
  departmentId: optUuid,
  jobTitleId: optUuid,
  riskLevel: z.string().default('medium'),
  criticalityReason: optStr,
  tierSelection: optStr,
  impact: optStr,
  reason: optStr,
  status: z.string().default('open'),
});

export const CriticalRoleUpdate = CriticalRoleCreate.partial().extend({ expectedUpdatedAt });

export const CriticalRoleListQuery = ListQuery.extend({
  status: z.string().optional(),
  riskLevel: z.string().optional(),
});

export const CriticalSkillCreate = z.object({
  criticalRoleId: z.string().uuid('Critical role is required'),
  skillName: z.string().min(1, 'Skill name is required'),
  importance: z.string().default('important'),
  notes: optStr,
});

export const CriticalSkillUpdate = CriticalSkillCreate.partial().extend({ expectedUpdatedAt });

export const CandidateCreate = z.object({
  criticalRoleId: z.string().uuid('Critical role is required'),
  employeeId: z.string().uuid('Employee is required'),
  dateInitiated: optDate,
  identifiedSuccessionPosition: optStr,
  lineManager: optStr,
  assessmentTier: optStr,
  subTier: optStr,
  focusArea: optStr,
  qualificationReq: optStr,
  experienceReq: optStr,
  psychologicalReq: optStr,
  culturalFitReq: optStr,
  complianceReq: optStr,
  possibleTargetPlan: optStr,
  readiness: z.string().default('1_2_years'),
  performanceRating: optStr,
  potentialRating: optStr,
  developmentNeeds: optStr,
  isPrimary: z.coerce.boolean().default(false),
  status: z.string().default('identified'),
});

export const CandidateUpdate = CandidateCreate.partial().extend({ expectedUpdatedAt });

export const CommitmentCreate = z.object({
  candidateId: z.string().uuid('Candidate is required'),
  commitment: z.string().min(1, 'Commitment is required'),
  dueDate: optDate,
  status: z.string().default('pending'),
});

export const CommitmentUpdate = CommitmentCreate.partial().extend({ expectedUpdatedAt });

export type SchemeCreate = z.infer<typeof SchemeCreate>;
export type SchemeUpdate = z.infer<typeof SchemeUpdate>;
export type CriticalRoleCreate = z.infer<typeof CriticalRoleCreate>;
export type CriticalRoleUpdate = z.infer<typeof CriticalRoleUpdate>;
export type CriticalSkillCreate = z.infer<typeof CriticalSkillCreate>;
export type CriticalSkillUpdate = z.infer<typeof CriticalSkillUpdate>;
export type CandidateCreate = z.infer<typeof CandidateCreate>;
export type CandidateUpdate = z.infer<typeof CandidateUpdate>;
export type CommitmentCreate = z.infer<typeof CommitmentCreate>;
export type CommitmentUpdate = z.infer<typeof CommitmentUpdate>;

/** JSON shapes returned to the client (dates serialise to ISO strings). */
export type SchemeRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type CriticalRoleRow = {
  id: string;
  title: string;
  refNo: string | null;
  lastReviewDate: string | null;
  incumbentEmployeeId: string | null;
  successorIdentifiedId: string | null;
  schemeId: string | null;
  regionId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  riskLevel: string;
  criticalityReason: string | null;
  tierSelection: string | null;
  impact: string | null;
  reason: string | null;
  status: string;
  updatedAt: string;
};

export type CriticalSkillRow = {
  id: string;
  criticalRoleId: string;
  skillName: string;
  importance: string;
  notes: string | null;
  updatedAt: string;
};

export type SuccessionCandidateRow = {
  id: string;
  criticalRoleId: string;
  employeeId: string;
  dateInitiated: string | null;
  identifiedSuccessionPosition: string | null;
  lineManager: string | null;
  assessmentTier: string | null;
  subTier: string | null;
  focusArea: string | null;
  qualificationReq: string | null;
  experienceReq: string | null;
  psychologicalReq: string | null;
  culturalFitReq: string | null;
  complianceReq: string | null;
  possibleTargetPlan: string | null;
  readiness: string;
  performanceRating: string | null;
  potentialRating: string | null;
  developmentNeeds: string | null;
  isPrimary: boolean;
  status: string;
  updatedAt: string;
};

export type SuccessionCommitmentRow = {
  id: string;
  candidateId: string;
  commitment: string;
  dueDate: string | null;
  status: string;
  updatedAt: string;
};
