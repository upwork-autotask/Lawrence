import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

export const CaseCreate = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  title: optStr,
  employeeId: z.string().uuid('Employee is required'),
  offenceId: z.string().uuid('Offence is required'),
  actionId: optUuid,
  typeOfDisciplinary: optStr,
  who: optStr,
  incidentDate: z.coerce.date({ required_error: 'Incident date is required' }),
  reportedDate: z.coerce.date({ required_error: 'Reported date is required' }),
  dateOfDisciplinary: optDate,
  dateOfEnquiry: optDate,
  actionOpenDate: optDate,
  actionClosedDate: optDate,
  description: z.string().min(1, 'Description is required'),
  status: z.string().default('open'),
  hearingDate: optDate,
  outcome: optStr,
  witnesses: optStr,
  criminalReferral: z.coerce.boolean().optional(),
  closedDate: optDate,
});

export const CaseUpdate = CaseCreate.partial().extend({ expectedUpdatedAt });

export const CaseListQuery = ListQuery.extend({
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  typeOfDisciplinary: z.string().optional(),
});

export type CaseCreate = z.infer<typeof CaseCreate>;
export type CaseUpdate = z.infer<typeof CaseUpdate>;

/** Lookup-style contracts for nature-of-offence and disciplinary-action tables. */
export const OffenceCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export const OffenceUpdate = OffenceCreate.partial().extend({ expectedUpdatedAt });

export const ActionCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export const ActionUpdate = ActionCreate.partial().extend({ expectedUpdatedAt });

export type OffenceCreate = z.infer<typeof OffenceCreate>;
export type ActionCreate = z.infer<typeof ActionCreate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type CaseRow = {
  id: string;
  caseNumber: string;
  title: string | null;
  employeeId: string;
  offenceId: string;
  actionId: string | null;
  typeOfDisciplinary: string | null;
  who: string | null;
  incidentDate: string;
  reportedDate: string;
  dateOfDisciplinary: string | null;
  dateOfEnquiry: string | null;
  actionOpenDate: string | null;
  actionClosedDate: string | null;
  description: string;
  status: string;
  hearingDate: string | null;
  outcome: string | null;
  witnesses: string | null;
  criminalReferral: boolean;
  closedDate: string | null;
  updatedAt: string;
};

/** Lookup row shape (offences & actions). */
export type OffenceRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type ActionRow = OffenceRow;
