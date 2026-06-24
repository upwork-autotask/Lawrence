import { z } from 'zod';
import { optStr, optUuid, optDate, expectedUpdatedAt, ListQuery } from './common';

const flag = z.coerce.boolean().optional().default(false);

export const TakeOnCreate = z.object({
  requesterName: optStr,
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  idNumber: optStr,
  dateEngaged: optDate,
  cellNumber: optStr,
  regionId: optUuid,
  departmentId: optUuid,
  jobTitleId: optUuid,
  emergencyContact: optStr,
  emergencyCell: optStr,
  unitNumber: optStr,
  streetNumber: optStr,
  streetName: optStr,
  complex: optStr,
  suburb: optStr,
  city: optStr,
  docIdCard: flag,
  docDrivingLicense: flag,
  docCriminalCheck: flag,
  docSageForm: flag,
  docBankConfirmation: flag,
  docSarsReg: flag,
  docContractOfEmp: flag,
  docPrdp: flag,
  docMedical: flag,
  docWorkPermit: flag,
  status: z.string().default('draft'),
});

export const TakeOnUpdate = TakeOnCreate.partial().extend({ expectedUpdatedAt });

export const TakeOnListQuery = ListQuery.extend({
  status: z.string().optional(),
});

export type TakeOnCreate = z.infer<typeof TakeOnCreate>;
export type TakeOnUpdate = z.infer<typeof TakeOnUpdate>;

export type TakeOnRow = {
  id: string;
  requesterName: string | null;
  firstName: string;
  surname: string;
  idNumber: string | null;
  dateEngaged: string | null;
  cellNumber: string | null;
  regionId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  emergencyContact: string | null;
  emergencyCell: string | null;
  unitNumber: string | null;
  streetNumber: string | null;
  streetName: string | null;
  complex: string | null;
  suburb: string | null;
  city: string | null;
  docIdCard: boolean;
  docDrivingLicense: boolean;
  docCriminalCheck: boolean;
  docSageForm: boolean;
  docBankConfirmation: boolean;
  docSarsReg: boolean;
  docContractOfEmp: boolean;
  docPrdp: boolean;
  docMedical: boolean;
  docWorkPermit: boolean;
  status: string;
  submittedAt: string | null;
  employeeId: string | null;
  updatedAt: string;
};
