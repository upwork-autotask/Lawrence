// MODULE: Employee take-on — legacy tblEmpTake (frmEmpTake / frmTakeReg).
// A new-hire onboarding intake form: basic details + an onboarding document
// checklist, captured by a requester before the full employee record exists.
import { pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import { regions, departments, jobTitles } from './lookups';

export const employeeTakeOns = pgTable(
  'employee_take_ons',
  {
    id: pk(),
    requesterName: text('requester_name'),

    // Basic details
    firstName: text('first_name').notNull(),
    surname: text('surname').notNull(),
    idNumber: text('id_number'),
    dateEngaged: timestamp('date_engaged', { withTimezone: true }),
    cellNumber: text('cell_number'),
    regionId: uuid('region_id').references(() => regions.id),
    departmentId: uuid('department_id').references(() => departments.id),
    jobTitleId: uuid('job_title_id').references(() => jobTitles.id),

    // Emergency
    emergencyContact: text('emergency_contact'),
    emergencyCell: text('emergency_cell'),

    // Address
    unitNumber: text('unit_number'),
    streetNumber: text('street_number'),
    streetName: text('street_name'),
    complex: text('complex'),
    suburb: text('suburb'),
    city: text('city'),

    // Onboarding document checklist (tblEmpTake yes/no flags)
    docIdCard: boolean('doc_id_card').notNull().default(false),
    docDrivingLicense: boolean('doc_driving_license').notNull().default(false),
    docCriminalCheck: boolean('doc_criminal_check').notNull().default(false),
    docSageForm: boolean('doc_sage_form').notNull().default(false),
    docBankConfirmation: boolean('doc_bank_confirmation').notNull().default(false),
    docSarsReg: boolean('doc_sars_reg').notNull().default(false),
    docContractOfEmp: boolean('doc_contract_of_emp').notNull().default(false),
    docPrdp: boolean('doc_prdp').notNull().default(false),
    docMedical: boolean('doc_medical').notNull().default(false),
    docWorkPermit: boolean('doc_work_permit').notNull().default(false),

    status: text('status').notNull().default('draft'), // draft | submitted | converted
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    // Set once a full employee record is created from this take-on.
    employeeId: uuid('employee_id'),

    ...auditColumns,
  },
  (t) => ({ statusIdx: index('employee_take_ons_status_idx').on(t.status) }),
);

export type EmployeeTakeOn = typeof employeeTakeOns.$inferSelect;
export type NewEmployeeTakeOn = typeof employeeTakeOns.$inferInsert;
