import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

export const ExitCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  exitType: z.string().default('resignation'),
  reasonId: optUuid,
  noticeDate: optDate,
  lastWorkingDay: optDate,
  interviewDate: optDate,
  interviewerId: optUuid,
  interviewNotes: optStr,
  regionId: optUuid,
  departmentId: optUuid,
  jobTitleId: optUuid,
  occupationalLevel: optStr,
  reasonCode: optStr,
  rehireEligible: z.coerce.boolean().optional(),
  assetsReturned: z.coerce.boolean().optional(),
  finalSettlementPaid: z.coerce.boolean().optional(),
  status: z.string().default('initiated'),
});

export const ExitUpdate = ExitCreate.partial().extend({ expectedUpdatedAt });

export const ExitListQuery = ListQuery.extend({
  status: z.string().optional(),
  exitType: z.string().optional(),
});

/** Lookup-style contract for the exit-reason catalogue. */
export const ReasonCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export const ReasonUpdate = ReasonCreate.partial().extend({ expectedUpdatedAt });

export type ExitCreate = z.infer<typeof ExitCreate>;
export type ExitUpdate = z.infer<typeof ExitUpdate>;
export type ReasonCreate = z.infer<typeof ReasonCreate>;
export type ReasonUpdate = z.infer<typeof ReasonUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type ExitRecordRow = {
  id: string;
  employeeId: string;
  exitType: string;
  reasonId: string | null;
  noticeDate: string | null;
  lastWorkingDay: string | null;
  interviewDate: string | null;
  interviewerId: string | null;
  interviewNotes: string | null;
  regionId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  occupationalLevel: string | null;
  reasonCode: string | null;
  rehireEligible: boolean | null;
  assetsReturned: boolean | null;
  finalSettlementPaid: boolean | null;
  status: string;
  updatedAt: string;
};

/** Lookup row shape (exit reasons). */
export type ExitReasonRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};
