import { pgTable, text, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';
import {
  regions, departments, jobTitles, depots, tiers,
  patersonGrades, eeGroups, nbcCouncils, taxStatuses,
} from './lookups';

/**
 * Central employee record — the hub every transactional table joins back to.
 * Maps from legacy `Employees Employment details` (108 cols); the most-used
 * columns are first-class, rare legacy fields can move to a key/value extras
 * table later without disturbing this one.
 */
export const employees = pgTable(
  'employees',
  {
    id: pk(),
    employeeNumber: text('employee_number').notNull(),
    firstName: text('first_name').notNull(),
    surname: text('surname').notNull(),
    middleNames: text('middle_names'),
    knownAs: text('known_as'),
    email: text('email'),
    phoneMobile: text('phone_mobile'),
    phoneHome: text('phone_home'),
    idNumber: text('id_number'),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    gender: text('gender'),
    maritalStatus: text('marital_status'),
    nationality: text('nationality'),
    ethnicity: text('ethnicity'),
    physicalAddress: text('physical_address'),
    postalAddress: text('postal_address'),

    hireDate: timestamp('hire_date', { withTimezone: true }),
    terminationDate: timestamp('termination_date', { withTimezone: true }),
    employmentStatus: text('employment_status').notNull().default('active'),
    contractType: text('contract_type'),

    regionId: uuid('region_id').references(() => regions.id),
    departmentId: uuid('department_id').references(() => departments.id),
    jobTitleId: uuid('job_title_id').references(() => jobTitles.id),
    depotId: uuid('depot_id').references(() => depots.id),
    tierId: uuid('tier_id').references(() => tiers.id),
    patersonGradeId: uuid('paterson_grade_id').references(() => patersonGrades.id),
    eeGroupId: uuid('ee_group_id').references(() => eeGroups.id),
    nbcCouncilId: uuid('nbc_council_id').references(() => nbcCouncils.id),
    taxStatusId: uuid('tax_status_id').references(() => taxStatuses.id),

    lineManagerId: uuid('line_manager_id'),

    notes: text('notes'),
    photoPath: text('photo_path'),

    ...auditColumns,
  },
  (t) => ({
    employeeNumberIdx: uniqueIndex('employees_employee_number_unique').on(t.employeeNumber),
    lineManagerIdx: index('employees_line_manager_idx').on(t.lineManagerId),
    statusIdx: index('employees_employment_status_idx').on(t.employmentStatus),
  }),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
