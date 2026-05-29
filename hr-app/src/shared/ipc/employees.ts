import { z } from 'zod';

export const EmployeeFormSchema = z.object({
  employeeNumber: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  surname: z.string().min(1, 'Required'),
  middleNames: z.string().nullish(),
  knownAs: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  phoneMobile: z.string().nullish(),
  phoneHome: z.string().nullish(),
  idNumber: z.string().nullish(),
  dateOfBirth: z.coerce.date().nullish(),
  gender: z.string().nullish(),
  maritalStatus: z.string().nullish(),
  nationality: z.string().nullish(),
  ethnicity: z.string().nullish(),
  physicalAddress: z.string().nullish(),
  postalAddress: z.string().nullish(),
  hireDate: z.coerce.date().nullish(),
  terminationDate: z.coerce.date().nullish(),
  employmentStatus: z.enum(['active', 'on_leave', 'suspended', 'terminated']).default('active'),
  contractType: z.string().nullish(),
  regionId: z.number().int().positive().nullish(),
  departmentId: z.number().int().positive().nullish(),
  jobTitleId: z.number().int().positive().nullish(),
  depotId: z.number().int().positive().nullish(),
  tierId: z.number().int().positive().nullish(),
  patersonGradeId: z.number().int().positive().nullish(),
  eeGroupId: z.number().int().positive().nullish(),
  nbcCouncilId: z.number().int().positive().nullish(),
  taxStatusId: z.number().int().positive().nullish(),
  lineManagerId: z.number().int().positive().nullish(),
  notes: z.string().nullish(),
});
export type EmployeeFormValues = z.infer<typeof EmployeeFormSchema>;

export const EmployeesListRequest = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional(),
  departmentId: z.number().int().positive().optional(),
  regionId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
});
export type EmployeesListRequest = z.infer<typeof EmployeesListRequest>;

export const EmployeeRow = z.object({
  id: z.number().int().positive(),
  employeeNumber: z.string(),
  firstName: z.string(),
  surname: z.string(),
  fullName: z.string(),
  email: z.string().nullable(),
  phoneMobile: z.string().nullable(),
  employmentStatus: z.string(),
  departmentName: z.string().nullable(),
  jobTitleName: z.string().nullable(),
  regionName: z.string().nullable(),
  hireDate: z.number().nullable(),
});
export type EmployeeRow = z.infer<typeof EmployeeRow>;

export const EmployeesListResponse = z.object({
  rows: z.array(EmployeeRow),
  total: z.number().int().nonnegative(),
});
export type EmployeesListResponse = z.infer<typeof EmployeesListResponse>;

export const EmployeesGetRequest = z.object({ id: z.number().int().positive() });
export const EmployeesCreateRequest = EmployeeFormSchema;
export const EmployeesUpdateRequest = EmployeeFormSchema.extend({ id: z.number().int().positive() });
export const EmployeesDeleteRequest = z.object({ id: z.number().int().positive() });
