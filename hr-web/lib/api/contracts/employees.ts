import { z } from 'zod';
import { optStr, optUuid, optDate, optNum, expectedUpdatedAt, ListQuery } from './common';

export const EmployeeCreate = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  // Personal
  title: optStr,
  initials: optStr,
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  middleNames: optStr,
  maidenName: optStr,
  knownAs: optStr,
  spouseName: optStr,
  email: z.preprocess((v) => (v === '' ? null : v), z.string().email('Invalid email').nullable().optional()),
  phoneMobile: optStr,
  phoneHome: optStr,
  phoneWork: optStr,
  idNumber: optStr,
  passportNumber: optStr,
  passportCountry: optStr,
  dateOfBirth: optDate,
  gender: optStr,
  maritalStatus: optStr,
  nationality: optStr,
  ethnicity: optStr,
  language: optStr,
  taxNumber: optStr,
  taxDirective: optStr,
  skillLevel: optStr,
  criticalSkills: optStr,
  // Emergency
  emergencyName: optStr,
  emergencyCell: optStr,
  emergencyWork: optStr,
  // Address — residential
  physicalAddress: optStr,
  postalAddress: optStr,
  resUnitNumber: optStr,
  resStreetNumber: optStr,
  resStreetName: optStr,
  resComplex: optStr,
  resSuburb: optStr,
  resCity: optStr,
  resPostalCode: optStr,
  // Address — postal
  postUnitNumber: optStr,
  postStreetNumber: optStr,
  postStreetName: optStr,
  postComplex: optStr,
  postSuburb: optStr,
  postCity: optStr,
  postPostalCode: optStr,
  // Banking
  paymentMethod: optStr,
  bankName: optStr,
  branchCode: optStr,
  accountHolderName: optStr,
  accountNumber: optStr,
  accountType: optStr,
  accountRelationship: optStr,
  // Appointment & payroll
  hireDate: optDate,
  terminationDate: optDate,
  employmentStatus: z.string().default('active'),
  contractType: optStr,
  jobGradeNbc: optStr,
  categoryNbc: optStr,
  account: optStr,
  costDepartment: optStr,
  costCenter: optStr,
  ratePerHour: optNum,
  monthlySalary: optNum,
  remunerationPerAnnum: optNum,
  uifStatus: optStr,
  medicalAidPlan: optStr,
  medicalAidAmount: optNum,
  vitalityAmount: optNum,
  site: optStr,
  jobFunctionalityEquity: optStr,
  occupationalLevelEquity: optStr,
  hoursPerMonth: optNum,
  hoursPerDay: optNum,
  annualLeaveEntitlement: optNum,
  momentum: optStr,
  momentumDate: optDate,
  momentumAmount: optNum,
  // Org FKs
  regionId: optUuid,
  departmentId: optUuid,
  jobTitleId: optUuid,
  depotId: optUuid,
  tierId: optUuid,
  patersonGradeId: optUuid,
  eeGroupId: optUuid,
  nbcCouncilId: optUuid,
  taxStatusId: optUuid,
  lineManagerId: optUuid,
  // Compliance & documents
  criminalCheck: optStr,
  sageForm: optStr,
  bankConfirmation: optStr,
  sarsDocument: optStr,
  contractDocument: optStr,
  jobDescriptionDocument: optStr,
  compliance: optStr,
  excoApproval: optStr,
  eeCommitteeRep: optStr,
  approval: optStr,
  currentPosition: optStr,
  notes: optStr,
});

export const EmployeeUpdate = EmployeeCreate.partial().extend({ expectedUpdatedAt });

export const EmployeeListQuery = ListQuery.extend({
  status: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
  jobTitleId: z.string().uuid().optional(),
  depotId: z.string().uuid().optional(),
  skillLevel: z.string().optional(),
  criticalSkills: z.string().optional(),
});

export type EmployeeCreate = z.infer<typeof EmployeeCreate>;
export type EmployeeUpdate = z.infer<typeof EmployeeUpdate>;

/** JSON shape returned to the client (dates serialise to ISO strings). */
export type EmployeeRow = {
  id: string;
  employeeNumber: string;
  // Personal
  title: string | null;
  initials: string | null;
  firstName: string;
  surname: string;
  middleNames: string | null;
  maidenName: string | null;
  knownAs: string | null;
  spouseName: string | null;
  email: string | null;
  phoneMobile: string | null;
  phoneHome: string | null;
  phoneWork: string | null;
  idNumber: string | null;
  passportNumber: string | null;
  passportCountry: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  ethnicity: string | null;
  language: string | null;
  taxNumber: string | null;
  taxDirective: string | null;
  skillLevel: string | null;
  criticalSkills: string | null;
  // Emergency
  emergencyName: string | null;
  emergencyCell: string | null;
  emergencyWork: string | null;
  // Address
  physicalAddress: string | null;
  postalAddress: string | null;
  resUnitNumber: string | null;
  resStreetNumber: string | null;
  resStreetName: string | null;
  resComplex: string | null;
  resSuburb: string | null;
  resCity: string | null;
  resPostalCode: string | null;
  postUnitNumber: string | null;
  postStreetNumber: string | null;
  postStreetName: string | null;
  postComplex: string | null;
  postSuburb: string | null;
  postCity: string | null;
  postPostalCode: string | null;
  // Banking
  paymentMethod: string | null;
  bankName: string | null;
  branchCode: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  accountRelationship: string | null;
  // Appointment & payroll
  hireDate: string | null;
  terminationDate: string | null;
  employmentStatus: string;
  contractType: string | null;
  jobGradeNbc: string | null;
  categoryNbc: string | null;
  account: string | null;
  costDepartment: string | null;
  costCenter: string | null;
  ratePerHour: number | null;
  monthlySalary: number | null;
  remunerationPerAnnum: number | null;
  uifStatus: string | null;
  medicalAidPlan: string | null;
  medicalAidAmount: number | null;
  vitalityAmount: number | null;
  site: string | null;
  jobFunctionalityEquity: string | null;
  occupationalLevelEquity: string | null;
  hoursPerMonth: number | null;
  hoursPerDay: number | null;
  annualLeaveEntitlement: number | null;
  momentum: string | null;
  momentumDate: string | null;
  momentumAmount: number | null;
  // Org FKs
  regionId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  depotId: string | null;
  tierId: string | null;
  patersonGradeId: string | null;
  eeGroupId: string | null;
  nbcCouncilId: string | null;
  taxStatusId: string | null;
  lineManagerId: string | null;
  // Compliance & documents
  criminalCheck: string | null;
  sageForm: string | null;
  bankConfirmation: string | null;
  sarsDocument: string | null;
  contractDocument: string | null;
  jobDescriptionDocument: string | null;
  compliance: string | null;
  excoApproval: string | null;
  eeCommitteeRep: string | null;
  approval: string | null;
  currentPosition: string | null;
  notes: string | null;
  updatedAt: string;
};
