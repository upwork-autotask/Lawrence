import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';
import { regions, departments, jobTitles, depots, tiers, patersonGrades, eeGroups, nbcCouncils, taxStatuses } from './lookups';

/**
 * Central employee record. Hub of the schema — every transactional table joins back here.
 * Maps from legacy `Employees Employment details` (108 cols). Only the most-used columns
 * are first-class here; rarely-used legacy fields land in `employee_extras` (key/value)
 * to keep this table tractable.
 */
export const employees = sqliteTable(
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
    dateOfBirth: integer('date_of_birth', { mode: 'timestamp_ms' }),
    gender: text('gender'),
    maritalStatus: text('marital_status'),
    nationality: text('nationality'),
    ethnicity: text('ethnicity'),
    physicalAddress: text('physical_address'),
    postalAddress: text('postal_address'),

    // Employment
    hireDate: integer('hire_date', { mode: 'timestamp_ms' }),
    terminationDate: integer('termination_date', { mode: 'timestamp_ms' }),
    employmentStatus: text('employment_status').notNull().default('active'),
    contractType: text('contract_type'),

    // Org placement
    regionId: integer('region_id').references(() => regions.id),
    departmentId: integer('department_id').references(() => departments.id),
    jobTitleId: integer('job_title_id').references(() => jobTitles.id),
    depotId: integer('depot_id').references(() => depots.id),
    tierId: integer('tier_id').references(() => tiers.id),
    patersonGradeId: integer('paterson_grade_id').references(() => patersonGrades.id),
    eeGroupId: integer('ee_group_id').references(() => eeGroups.id),
    nbcCouncilId: integer('nbc_council_id').references(() => nbcCouncils.id),
    taxStatusId: integer('tax_status_id').references(() => taxStatuses.id),

    lineManagerId: integer('line_manager_id'),

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

export const employeeAttachments = sqliteTable(
  'employee_attachments',
  {
    id: pk(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    path: text('path').notNull(),
    originalName: text('original_name').notNull(),
    mime: text('mime'),
    sizeBytes: integer('size_bytes'),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => ({
    empIdx: index('employee_attachments_employee_idx').on(t.employeeId),
  }),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
