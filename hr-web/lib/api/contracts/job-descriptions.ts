import { z } from 'zod';
import { optStr, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

export const JdCreate = z.object({
  title: z.string().min(1, 'Title is required'),
  version: z.coerce.number().int().default(1),
  status: z.string().default('draft'), // draft|active|retired
  summary: optStr,
  reportsToTitle: optStr,
  effectiveDate: optDate,
});

export const JdUpdate = JdCreate.partial().extend({ expectedUpdatedAt });

export const JdListQuery = ListQuery.extend({
  status: z.string().optional(),
});

export const JdEntryCreate = z.object({
  jdId: z.string().uuid('Job description is required'),
  section: z.string().min(1, 'Section is required'),
  body: optStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const JdEntryUpdate = JdEntryCreate.partial().extend({ expectedUpdatedAt });

export const JdEntryListQuery = ListQuery.extend({
  jdId: z.string().uuid().optional(),
});

export const JdRoleCreate = z.object({
  jdId: z.string().uuid('Job description is required'),
  description: z.string().min(1, 'Description is required'),
  weight: z.coerce.number().default(1),
  sortOrder: z.coerce.number().int().default(0),
});

export const JdRoleUpdate = JdRoleCreate.partial().extend({ expectedUpdatedAt });

export const JdRoleListQuery = ListQuery.extend({
  jdId: z.string().uuid().optional(),
});

export const EmployeeJdCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  jdId: z.string().uuid('Job description is required'),
  assignedAt: z.coerce.date({ required_error: 'Assigned date is required', invalid_type_error: 'Assigned date is required' }),
  status: z.string().default('assigned'), // assigned|acknowledged|signed_off
  notes: optStr,
});

export const EmployeeJdUpdate = EmployeeJdCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeJdListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  jdId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const JdKpiCreate = z.object({
  jdId: z.string().uuid('Job description is required'),
  kpiId: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.string().uuid().nullable().optional()),
  target: optStr,
  weight: z.coerce.number().default(1),
  sortOrder: z.coerce.number().int().default(0),
});

export const JdKpiUpdate = JdKpiCreate.partial().extend({ expectedUpdatedAt });

export const JdTrainingCreate = z.object({
  jdId: z.string().uuid('Job description is required'),
  trainingId: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.string().uuid().nullable().optional()),
  required: z.coerce.boolean().default(false),
  frequency: optStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const JdTrainingUpdate = JdTrainingCreate.partial().extend({ expectedUpdatedAt });

export const JdChildListQuery = ListQuery.extend({
  jdId: z.string().uuid().optional(),
});

export type JdCreate = z.infer<typeof JdCreate>;
export type JdUpdate = z.infer<typeof JdUpdate>;
export type JdEntryCreate = z.infer<typeof JdEntryCreate>;
export type JdEntryUpdate = z.infer<typeof JdEntryUpdate>;
export type JdRoleCreate = z.infer<typeof JdRoleCreate>;
export type JdRoleUpdate = z.infer<typeof JdRoleUpdate>;
export type EmployeeJdCreate = z.infer<typeof EmployeeJdCreate>;
export type EmployeeJdUpdate = z.infer<typeof EmployeeJdUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type JdRow = {
  id: string;
  title: string;
  version: number;
  status: string;
  summary: string | null;
  reportsToTitle: string | null;
  effectiveDate: string | null;
  updatedAt: string;
};

export type JdEntryRow = {
  id: string;
  jdId: string;
  section: string;
  body: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type JdRoleRow = {
  id: string;
  jdId: string;
  description: string;
  weight: number;
  sortOrder: number;
  updatedAt: string;
};

export type EmployeeJdRow = {
  id: string;
  employeeId: string;
  jdId: string;
  assignedAt: string;
  status: string;
  notes: string | null;
  updatedAt: string;
};
