import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

export const LeaveFormCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  leaveTypeId: z.string().uuid('Leave type is required'),
  startDate: z.coerce.date({ required_error: 'Start date is required', invalid_type_error: 'Start date is required' }),
  endDate: z.coerce.date({ required_error: 'End date is required', invalid_type_error: 'End date is required' }),
  daysRequested: z.coerce.number({ required_error: 'Days requested is required', invalid_type_error: 'Days requested is required' }),
  reason: optStr,
  status: z.string().default('draft'),
  lineManagerStatus: z.string().default('pending'),
  hrStatus: z.string().default('pending'),
  lineManagerComments: optStr,
  hrComments: optStr,
});

export const LeaveFormUpdate = LeaveFormCreate.partial().extend({ expectedUpdatedAt });

export const LeaveListQuery = ListQuery.extend({
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
});

export const LeaveTypeCreate = z.object({
  code: optStr,
  name: z.string().min(1, 'Name is required'),
  description: optStr,
  isActive: z.coerce.boolean().default(true),
  defaultDays: z.coerce.number().default(0),
  requiresAttachment: z.coerce.boolean().default(false),
  accrualPerMonth: z.coerce.number().default(0),
});

export const LeaveTypeUpdate = LeaveTypeCreate.partial().extend({ expectedUpdatedAt });

export const LeaveApprove = z.object({
  step: z.enum(['lineManager', 'hr']),
  decision: z.enum(['approved', 'rejected']),
  comments: optStr,
});

export type LeaveFormCreate = z.infer<typeof LeaveFormCreate>;
export type LeaveFormUpdate = z.infer<typeof LeaveFormUpdate>;
export type LeaveTypeCreate = z.infer<typeof LeaveTypeCreate>;
export type LeaveTypeUpdate = z.infer<typeof LeaveTypeUpdate>;
export type LeaveApprove = z.infer<typeof LeaveApprove>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type LeaveFormRow = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string | null;
  status: string;
  lineManagerStatus: string;
  lineManagerComments: string | null;
  lineManagerDecidedAt: string | null;
  hrStatus: string;
  hrComments: string | null;
  hrDecidedAt: string | null;
  updatedAt: string;
};

export type LeaveTypeRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  defaultDays: number;
  requiresAttachment: boolean;
  accrualPerMonth: number;
  updatedAt: string;
};
