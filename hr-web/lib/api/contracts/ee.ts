import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

// ── EE recruitment targets (tblRecruitmentTarget) ──
export const TargetCreate = z.object({
  periodYear: z.coerce.number({ required_error: 'Year is required', invalid_type_error: 'Year is required' }).int(),
  dueDate: optDate,
  occupationalLevel: optStr,
  employmentType: optStr,
  gender: optStr,
  race: optStr,
  targetCount: z.coerce.number().int().default(0),
  achievedCount: z.coerce.number().int().default(0),
  eeGroupId: optUuid,
});
export const TargetUpdate = TargetCreate.partial().extend({ expectedUpdatedAt });
export const TargetListQuery = ListQuery.extend({ periodYear: z.coerce.number().int().optional() });

// ── EE actual-appointment register (tblActualRecruitment) ──
export const ActualCreate = z.object({
  dueDate: optDate,
  regionId: optUuid,
  departmentId: optUuid,
  name: optStr,
  surname: optStr,
  companyNo: optStr,
  jobTitle: optStr,
  occupationalLevel: optStr,
  employmentType: optStr,
  gender: optStr,
  race: optStr,
  value: z.coerce.number().int().default(1),
  reasonForAppointment: optStr,
  responsibleExecutive: optStr,
  responsibleManager: optStr,
  progressStatus: z.string().default('appointed'),
  reason: optStr,
  nonEe: z.coerce.boolean().default(false),
  approval: optStr,
  nonRecruitmentReasonId: optUuid,
  supportingDocument: optStr,
});
export const ActualUpdate = ActualCreate.partial().extend({ expectedUpdatedAt });
export const ActualListQuery = ListQuery.extend({ progressStatus: z.string().optional() });

export type TargetCreate = z.infer<typeof TargetCreate>;
export type TargetUpdate = z.infer<typeof TargetUpdate>;
export type ActualCreate = z.infer<typeof ActualCreate>;
export type ActualUpdate = z.infer<typeof ActualUpdate>;

export type TargetRow = {
  id: string;
  periodYear: number;
  dueDate: string | null;
  occupationalLevel: string | null;
  employmentType: string | null;
  gender: string | null;
  race: string | null;
  targetCount: number;
  achievedCount: number;
  eeGroupId: string | null;
  updatedAt: string;
};

export type ActualRow = {
  id: string;
  dueDate: string | null;
  regionId: string | null;
  departmentId: string | null;
  name: string | null;
  surname: string | null;
  companyNo: string | null;
  jobTitle: string | null;
  occupationalLevel: string | null;
  employmentType: string | null;
  gender: string | null;
  race: string | null;
  value: number;
  reasonForAppointment: string | null;
  responsibleExecutive: string | null;
  responsibleManager: string | null;
  progressStatus: string;
  reason: string | null;
  nonEe: boolean;
  approval: string | null;
  nonRecruitmentReasonId: string | null;
  supportingDocument: string | null;
  updatedAt: string;
};
