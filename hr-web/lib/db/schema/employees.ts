import { pgTable, text, timestamp, uuid, doublePrecision, uniqueIndex, index } from 'drizzle-orm/pg-core';
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
    // ── Personal (Access "Personal" tab) ──
    title: text('title'),
    initials: text('initials'),
    firstName: text('first_name').notNull(),
    surname: text('surname').notNull(),
    middleNames: text('middle_names'),
    maidenName: text('maiden_name'),
    knownAs: text('known_as'),
    spouseName: text('spouse_name'),
    email: text('email'),
    phoneMobile: text('phone_mobile'),
    phoneHome: text('phone_home'),
    phoneWork: text('phone_work'),
    idNumber: text('id_number'),
    passportNumber: text('passport_number'),
    passportCountry: text('passport_country'),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    gender: text('gender'),
    maritalStatus: text('marital_status'),
    nationality: text('nationality'),
    ethnicity: text('ethnicity'),
    language: text('language'),
    taxNumber: text('tax_number'), // IncomeTaxNumber
    taxDirective: text('tax_directive'), // Directive
    skillLevel: text('skill_level'),
    criticalSkills: text('critical_skills'),

    // ── Emergency contact (Access "Emergency & Address" tab) ──
    emergencyName: text('emergency_name'),
    emergencyCell: text('emergency_cell'),
    emergencyWork: text('emergency_work'),

    // ── Address: residential ── (kept legacy joined strings too)
    physicalAddress: text('physical_address'),
    postalAddress: text('postal_address'),
    resUnitNumber: text('res_unit_number'),
    resStreetNumber: text('res_street_number'),
    resStreetName: text('res_street_name'),
    resComplex: text('res_complex'),
    resSuburb: text('res_suburb'),
    resCity: text('res_city'),
    resPostalCode: text('res_postal_code'),
    // ── Address: postal ──
    postUnitNumber: text('post_unit_number'),
    postStreetNumber: text('post_street_number'),
    postStreetName: text('post_street_name'),
    postComplex: text('post_complex'),
    postSuburb: text('post_suburb'),
    postCity: text('post_city'),
    postPostalCode: text('post_postal_code'),

    // ── Banking (Access "Banking" tab) ──
    paymentMethod: text('payment_method'),
    bankName: text('bank_name'),
    branchCode: text('branch_code'),
    accountHolderName: text('account_holder_name'),
    accountNumber: text('account_number'),
    accountType: text('account_type'),
    accountRelationship: text('account_relationship'),

    // ── Appointment & payroll (Access "Appointment" tab) ──
    hireDate: timestamp('hire_date', { withTimezone: true }),
    terminationDate: timestamp('termination_date', { withTimezone: true }),
    employmentStatus: text('employment_status').notNull().default('active'),
    contractType: text('contract_type'),
    jobGradeNbc: text('job_grade_nbc'),
    categoryNbc: text('category_nbc'),
    account: text('account'),
    costDepartment: text('cost_department'),
    costCenter: text('cost_center'),
    ratePerHour: doublePrecision('rate_per_hour'),
    monthlySalary: doublePrecision('monthly_salary'),
    remunerationPerAnnum: doublePrecision('remuneration_per_annum'),
    uifStatus: text('uif_status'),
    medicalAidPlan: text('medical_aid_plan'),
    medicalAidAmount: doublePrecision('medical_aid_amount'),
    vitalityAmount: doublePrecision('vitality_amount'),
    site: text('site'),
    jobFunctionalityEquity: text('job_functionality_equity'),
    occupationalLevelEquity: text('occupational_level_equity'),
    hoursPerMonth: doublePrecision('hours_per_month'),
    hoursPerDay: doublePrecision('hours_per_day'),
    annualLeaveEntitlement: doublePrecision('annual_leave_entitlement'),
    momentum: text('momentum'),
    momentumDate: timestamp('momentum_date', { withTimezone: true }),
    momentumAmount: doublePrecision('momentum_amount'),

    // ── Compliance & documents (Access "Documents"/"Others" tabs) ──
    criminalCheck: text('criminal_check'),
    sageForm: text('sage_form'),
    bankConfirmation: text('bank_confirmation'),
    sarsDocument: text('sars_document'),
    contractDocument: text('contract_document'),
    jobDescriptionDocument: text('job_description_document'),
    compliance: text('compliance'),
    excoApproval: text('exco_approval'),
    eeCommitteeRep: text('ee_committee_rep'),
    approval: text('approval'),
    currentPosition: text('current_position'),

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
