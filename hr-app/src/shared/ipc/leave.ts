import { z } from 'zod';

/* ---------- Leave types (catalogue) ---------- */

export const LeaveTypeFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1, 'Required'),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  defaultDays: z.number().nonnegative().default(0),
  requiresAttachment: z.boolean().default(false),
  accrualPerMonth: z.number().nonnegative().default(0),
});
export type LeaveTypeFormValues = z.infer<typeof LeaveTypeFormSchema>;

export const LeaveTypeRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  defaultDays: z.number(),
  requiresAttachment: z.boolean(),
  accrualPerMonth: z.number(),
});
export type LeaveTypeRow = z.infer<typeof LeaveTypeRow>;

export const LeaveTypeListRequest = z.object({
  includeInactive: z.boolean().default(false),
});
export type LeaveTypeListRequest = z.infer<typeof LeaveTypeListRequest>;

export const LeaveTypeListResponse = z.object({
  rows: z.array(LeaveTypeRow),
});
export type LeaveTypeListResponse = z.infer<typeof LeaveTypeListResponse>;

export const LeaveTypeCreateRequest = LeaveTypeFormSchema;
export const LeaveTypeUpdateRequest = LeaveTypeFormSchema.extend({
  id: z.number().int().positive(),
});
export const LeaveTypeDeleteRequest = z.object({ id: z.number().int().positive() });

/* ---------- Leave applications ---------- */

export const LeaveStatus = z.enum(['draft', 'submitted', 'approved', 'rejected', 'cancelled']);
export type LeaveStatus = z.infer<typeof LeaveStatus>;

export const ApprovalStatus = z.enum(['pending', 'approved', 'rejected']);
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;

export const LeaveFormSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  daysRequested: z.number().positive(),
  reason: z.string().nullish(),
  attachmentPath: z.string().nullish(),
  status: LeaveStatus.default('draft'),
  lineManagerId: z.number().int().positive().nullish(),
});
export type LeaveFormValues = z.infer<typeof LeaveFormSchema>;

export const LeaveRow = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  leaveTypeId: z.number().int().positive(),
  leaveTypeName: z.string().nullable(),
  startDate: z.number(),
  endDate: z.number(),
  daysRequested: z.number(),
  reason: z.string().nullable(),
  attachmentPath: z.string().nullable(),
  status: LeaveStatus,
  lineManagerId: z.number().int().positive().nullable(),
  lineManagerStatus: ApprovalStatus,
  lineManagerDecidedAt: z.number().nullable(),
  lineManagerComments: z.string().nullable(),
  hrId: z.number().int().positive().nullable(),
  hrStatus: ApprovalStatus,
  hrDecidedAt: z.number().nullable(),
  hrComments: z.string().nullable(),
  emailStatus: z.enum(['pending', 'sent', 'failed']),
});
export type LeaveRow = z.infer<typeof LeaveRow>;

export const LeaveListRequest = z.object({
  search: z.string().optional(),
  status: LeaveStatus.optional(),
  employeeId: z.number().int().positive().optional(),
  leaveTypeId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type LeaveListRequest = z.infer<typeof LeaveListRequest>;

export const LeaveListResponse = z.object({
  rows: z.array(LeaveRow),
  total: z.number().int().nonnegative(),
});
export type LeaveListResponse = z.infer<typeof LeaveListResponse>;

export const LeaveGetRequest = z.object({ id: z.number().int().positive() });
export const LeaveCreateRequest = LeaveFormSchema;
export const LeaveUpdateRequest = LeaveFormSchema.extend({
  id: z.number().int().positive(),
});
export const LeaveDeleteRequest = z.object({ id: z.number().int().positive() });

export const LeaveApproveRequest = z.object({
  id: z.number().int().positive(),
  step: z.enum(['line_manager', 'hr']).default('hr'),
  decision: z.enum(['approved', 'rejected']),
  comments: z.string().nullish(),
});
export type LeaveApproveRequest = z.infer<typeof LeaveApproveRequest>;

/* ---------- Leave balances ---------- */

export const LeaveBalanceRow = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string().nullable(),
  leaveTypeId: z.number().int().positive(),
  leaveTypeName: z.string().nullable(),
  year: z.number().int(),
  allocated: z.number(),
  taken: z.number(),
  pending: z.number(),
});
export type LeaveBalanceRow = z.infer<typeof LeaveBalanceRow>;

export const LeaveBalanceListRequest = z.object({
  employeeId: z.number().int().positive().optional(),
  leaveTypeId: z.number().int().positive().optional(),
  year: z.number().int().optional(),
});
export type LeaveBalanceListRequest = z.infer<typeof LeaveBalanceListRequest>;

export const LeaveBalanceListResponse = z.object({
  rows: z.array(LeaveBalanceRow),
});
export type LeaveBalanceListResponse = z.infer<typeof LeaveBalanceListResponse>;
