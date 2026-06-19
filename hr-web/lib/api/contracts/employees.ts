import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

export const EmployeeCreate = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  knownAs: optStr,
  email: z.preprocess((v) => (v === '' ? null : v), z.string().email('Invalid email').nullable().optional()),
  phoneMobile: optStr,
  idNumber: optStr,
  dateOfBirth: optDate,
  gender: optStr,
  maritalStatus: optStr,
  nationality: optStr,
  physicalAddress: optStr,
  hireDate: optDate,
  terminationDate: optDate,
  employmentStatus: z.string().default('active'),
  contractType: optStr,
  regionId: optUuid,
  departmentId: optUuid,
  jobTitleId: optUuid,
  depotId: optUuid,
  lineManagerId: optUuid,
  notes: optStr,
});

export const EmployeeUpdate = EmployeeCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeListQuery = ListQuery.extend({
  status: z.string().optional(),
});

export type EmployeeCreate = z.infer<typeof EmployeeCreate>;
export type EmployeeUpdate = z.infer<typeof EmployeeUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type EmployeeRow = {
  id: string;
  employeeNumber: string;
  firstName: string;
  surname: string;
  knownAs: string | null;
  email: string | null;
  phoneMobile: string | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  employmentStatus: string;
  contractType: string | null;
  regionId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  depotId: string | null;
  lineManagerId: string | null;
  notes: string | null;
  updatedAt: string;
};
