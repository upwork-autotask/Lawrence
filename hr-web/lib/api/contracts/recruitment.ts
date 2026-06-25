import { z } from 'zod';
import { optStr, optUuid, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

/* ── Recruitment requisitions ──────────────────────────────────────────── */

export const RequestCreate = z.object({
  positionTitle: z.string().min(1, 'Position title is required'),
  departmentId: optUuid,
  regionId: optUuid,
  jobTitleId: optUuid,
  headcount: z.coerce.number().int().default(1),
  motivation: optStr,
  employmentType: optStr,
  targetStartDate: optDate,
  status: z.string().default('draft'),
});

export const RequestUpdate = RequestCreate.partial().extend({ expectedUpdatedAt });

export const RequestListQuery = ListQuery.extend({
  status: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
  jobTitleId: z.string().uuid().optional(),
  employmentType: z.string().optional(),
});

/* ── Candidates ────────────────────────────────────────────────────────── */

export const CandidateCreate = z.object({
  requestId: z.string().uuid('Requisition is required'),
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: optStr,
  phone: optStr,
  idNumber: optStr,
  source: optStr,
  cvPath: optStr,
  eeGroupId: optUuid,
  rejectionReasonId: optUuid,
  status: z.string().default('applied'),
});

export const CandidateUpdate = CandidateCreate.partial().extend({ expectedUpdatedAt });

export const CandidateListQuery = ListQuery.extend({
  requestId: z.string().uuid().optional(),
});

/* ── Interviews ────────────────────────────────────────────────────────── */

export const InterviewCreate = z.object({
  requestId: z.string().uuid('Requisition is required'),
  candidateId: z.string().uuid('Candidate is required'),
  scheduledAt: optDate,
  venue: optStr,
  notes: optStr,
  stage: z.string().default('first'),
  status: z.string().default('scheduled'),
});

export const InterviewUpdate = InterviewCreate.partial().extend({ expectedUpdatedAt });

export const InterviewListQuery = ListQuery.extend({
  requestId: z.string().uuid().optional(),
});

/* ── Interview leads (multi-member panel junction) ─────────────────────── */

export const InterviewLeadCreate = z.object({
  interviewId: z.string().uuid('Interview is required'),
  employeeId: z.string().uuid('Panel member is required'),
  roleOnPanel: optStr,
  notes: optStr,
  isPrimary: z.coerce.boolean().default(false),
});

export const InterviewLeadUpdate = InterviewLeadCreate.partial().extend({ expectedUpdatedAt });

export const InterviewLeadListQuery = ListQuery.extend({
  interviewId: z.string().uuid().optional(),
});

/* ── Evaluations ───────────────────────────────────────────────────────── */

export const EvaluationCreate = z.object({
  interviewId: z.string().uuid('Interview is required'),
  candidateId: z.string().uuid('Candidate is required'),
  evaluatorEmployeeId: optUuid,
  score: optNum,
  maxScore: z.coerce.number().default(100),
  strengths: optStr,
  weaknesses: optStr,
  recommendation: optStr,
});

export const EvaluationUpdate = EvaluationCreate.partial().extend({ expectedUpdatedAt });

export const EvaluationListQuery = ListQuery.extend({
  interviewId: z.string().uuid().optional(),
});

/* ── Non-recruitment reasons (lookup-style) ───────────────────────────── */

export const ReasonCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const ReasonUpdate = ReasonCreate.partial().extend({ expectedUpdatedAt });

export type RequestCreate = z.infer<typeof RequestCreate>;
export type RequestUpdate = z.infer<typeof RequestUpdate>;
export type CandidateCreate = z.infer<typeof CandidateCreate>;
export type CandidateUpdate = z.infer<typeof CandidateUpdate>;
export type InterviewCreate = z.infer<typeof InterviewCreate>;
export type InterviewUpdate = z.infer<typeof InterviewUpdate>;
export type InterviewLeadCreate = z.infer<typeof InterviewLeadCreate>;
export type InterviewLeadUpdate = z.infer<typeof InterviewLeadUpdate>;
export type EvaluationCreate = z.infer<typeof EvaluationCreate>;
export type EvaluationUpdate = z.infer<typeof EvaluationUpdate>;
export type ReasonCreate = z.infer<typeof ReasonCreate>;
export type ReasonUpdate = z.infer<typeof ReasonUpdate>;

/* ── JSON row shapes returned to the client (dates serialise to ISO) ───── */

export type RequestRow = {
  id: string;
  requestNumber: string | null;
  positionTitle: string;
  jobTitleId: string | null;
  departmentId: string | null;
  regionId: string | null;
  headcount: number;
  motivation: string | null;
  employmentType: string | null;
  targetStartDate: string | null;
  status: string;
  updatedAt: string;
};

export type CandidateRow = {
  id: string;
  requestId: string;
  firstName: string;
  surname: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  source: string | null;
  cvPath: string | null;
  eeGroupId: string | null;
  rejectionReasonId: string | null;
  status: string;
  updatedAt: string;
};

export type InterviewRow = {
  id: string;
  requestId: string;
  candidateId: string;
  scheduledAt: string | null;
  venue: string | null;
  notes: string | null;
  stage: string;
  status: string;
  updatedAt: string;
};

export type InterviewLeadRow = {
  id: string;
  interviewId: string;
  employeeId: string;
  roleOnPanel: string | null;
  notes: string | null;
  isPrimary: boolean;
  updatedAt: string;
};

export type EvaluationRow = {
  id: string;
  interviewId: string;
  candidateId: string;
  evaluatorEmployeeId: string | null;
  score: number | null;
  maxScore: number;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
  updatedAt: string;
};

export type ReasonRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};
