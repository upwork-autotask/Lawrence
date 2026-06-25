import { z } from 'zod';
import { optStr, optDate, expectedUpdatedAt, ListQuery } from './common';

/* ── Per-employee internal training (employee_training_internal) ──────────── */

export const EmployeeTrainingInternalCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  trainingId: z.string().uuid('Training is required'),
  trainingType: optStr,
  assignedAt: optDate,
  status: z.string().default('assigned'),
});

export const EmployeeTrainingInternalUpdate = EmployeeTrainingInternalCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeTrainingInternalListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  trainingId: z.string().uuid().optional(),
  status: z.string().optional(),
});

/* ── Per-employee external training (employee_training_external) ──────────── */

export const EmployeeTrainingExternalCreate = z.object({
  employeeId: z.string().uuid('Employee is required'),
  trainingId: z.string().uuid('Training is required'),
  trainingType: optStr,
  assignedAt: optDate,
  status: z.string().default('assigned'),
});

export const EmployeeTrainingExternalUpdate = EmployeeTrainingExternalCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeTrainingExternalListQuery = ListQuery.extend({
  employeeId: z.string().uuid().optional(),
  trainingId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export type EmployeeTrainingInternalCreate = z.infer<typeof EmployeeTrainingInternalCreate>;
export type EmployeeTrainingInternalUpdate = z.infer<typeof EmployeeTrainingInternalUpdate>;
export type EmployeeTrainingExternalCreate = z.infer<typeof EmployeeTrainingExternalCreate>;
export type EmployeeTrainingExternalUpdate = z.infer<typeof EmployeeTrainingExternalUpdate>;

export type EmployeeTrainingInternalRow = {
  id: string;
  employeeId: string;
  trainingId: string;
  trainingType: string | null;
  assignedAt: string;
  status: string;
  updatedAt: string;
};

export type EmployeeTrainingExternalRow = {
  id: string;
  employeeId: string;
  trainingId: string;
  trainingType: string | null;
  assignedAt: string;
  status: string;
  updatedAt: string;
};
