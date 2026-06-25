import { z } from 'zod';
import { optStr, optUuid, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

/**
 * Candidate assessment master (Access `FrmRecruitmentForm`). Every scored
 * question stores the leading integer code from its Access value-list; the
 * service derives `totalScore` from the sum of those answers (so it is omitted
 * from the create/update payload).
 */
export const CandidateAssessmentCreate = z.object({
  candidateId: z.string().uuid('Candidate is required'),
  // Header
  appliedJobTitleId: optUuid,
  regionId: optUuid,
  departmentId: optUuid,
  applicationType: optStr, // Internal Applicant | For Promotion | External Candidate
  gender: optStr, // Male | Female
  // Scored value-list questions (leading integer code)
  qualificationRelevant: optNum,
  yearsExperienceField: optNum,
  yearsExperienceIndustry: optNum,
  budgetFinanceExperience: optNum,
  managedEmployees: optNum,
  creditCheck: optNum,
  eeGroup: optNum,
  demographic: optNum,
  meetsEePolicy: optNum,
  computerLiterate: optNum,
  sheqIsoKnowledge: optNum,
  hrSkills: optNum,
  highestQualification: optNum,
  employedBefore: optNum,
  abilityToCompleteTask: optNum,
  attendance: optNum,
  // Free-text narratives
  strengths: optStr,
  weaknesses: optStr,
  eeJustification: optStr,
  otherQualifications: optStr,
  companiesWorkedFor: optStr,
  companyName: optStr,
  referenceRemark: optStr,
  homeAddress: optStr,
  phone: optStr,
  assessmentReportPath: optStr,
  assessedAt: optDate,
});

export const CandidateAssessmentUpdate = CandidateAssessmentCreate.partial().extend({ expectedUpdatedAt });

export const CandidateAssessmentListQuery = ListQuery.extend({
  candidateId: z.string().uuid().optional(),
});

/** Body for converting a candidate into an employee (Make Employee action). */
export const MakeEmployee = z.object({
  employeeNumber: optStr, // optional override; generated when omitted
});

export type CandidateAssessmentCreate = z.infer<typeof CandidateAssessmentCreate>;
export type CandidateAssessmentUpdate = z.infer<typeof CandidateAssessmentUpdate>;
export type MakeEmployee = z.infer<typeof MakeEmployee>;

/** The integer-coded scored questions, in score order. Used by the service total. */
export const ASSESSMENT_SCORE_KEYS = [
  'qualificationRelevant',
  'yearsExperienceField',
  'yearsExperienceIndustry',
  'budgetFinanceExperience',
  'managedEmployees',
  'creditCheck',
  'eeGroup',
  'demographic',
  'meetsEePolicy',
  'computerLiterate',
  'sheqIsoKnowledge',
  'hrSkills',
  'highestQualification',
  'employedBefore',
  'abilityToCompleteTask',
  'attendance',
] as const;

/** JSON row shape returned to the client (dates serialise to ISO strings). */
export type CandidateAssessmentRow = {
  id: string;
  candidateId: string;
  appliedJobTitleId: string | null;
  regionId: string | null;
  departmentId: string | null;
  applicationType: string | null;
  gender: string | null;
  qualificationRelevant: number | null;
  yearsExperienceField: number | null;
  yearsExperienceIndustry: number | null;
  budgetFinanceExperience: number | null;
  managedEmployees: number | null;
  creditCheck: number | null;
  eeGroup: number | null;
  demographic: number | null;
  meetsEePolicy: number | null;
  computerLiterate: number | null;
  sheqIsoKnowledge: number | null;
  hrSkills: number | null;
  highestQualification: number | null;
  employedBefore: number | null;
  abilityToCompleteTask: number | null;
  attendance: number | null;
  strengths: string | null;
  weaknesses: string | null;
  eeJustification: string | null;
  otherQualifications: string | null;
  companiesWorkedFor: string | null;
  companyName: string | null;
  referenceRemark: string | null;
  homeAddress: string | null;
  phone: string | null;
  assessmentReportPath: string | null;
  assessedAt: string | null;
  totalScore: number | null;
  updatedAt: string;
};

export type MakeEmployeeResult = { employeeId: string; candidateId: string };
