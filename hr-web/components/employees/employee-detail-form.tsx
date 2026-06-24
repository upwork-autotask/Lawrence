'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeCreate } from '@/lib/api/contracts/employees';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { employeesApi } from '@/lib/api/resources';
import { EntityAttachments } from '@/components/employees/entity-attachments';
import { employeeAttachmentsApi } from '@/lib/api/attachments-client';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type EmployeeLookups = {
  departments: LookupRow[]; jobTitles: LookupRow[]; regions: LookupRow[]; depots: LookupRow[];
  tiers: LookupRow[]; patersonGrades: LookupRow[]; eeGroups: LookupRow[];
  nbcCouncils: LookupRow[]; taxStatuses: LookupRow[]; sites: LookupRow[];
  managers: { id: string; name: string }[];
};

type Opt = { value: string; label: string };
type FieldDef = { name: string; label: string; type?: 'text' | 'date' | 'number' | 'email'; options?: Opt[]; fk?: boolean };

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const numStr = (n: number | null | undefined) => (n != null ? String(n) : '');
const lookupOpts = (rows: LookupRow[]): Opt[] => rows.map((r) => ({ value: r.id, label: r.name }));
const vl = (...vals: string[]): Opt[] => vals.map((v) => ({ value: v, label: v }));

// Value lists taken verbatim from the Access FrmEmployeeDetails comboboxes.
const TITLE = vl('MR', 'MS', 'MRS', 'DR', 'PROF');
const ETHNICITY = vl('African', 'Coloured', 'White', 'Indian');
const GENDER = vl('Male', 'Female', 'Trust', 'Company or CC');
const MARITAL = vl('Single', 'Married', 'Divorced');
const SKILL_LEVEL = vl('Skilled', 'Semi-skilled', 'Unskilled', 'Professional');
const CRITICAL = vl('High', 'Medium', 'Low', 'Insignificant');
const PAYMENT = vl('Cash', 'EFT', 'Cheque');
const ACCOUNT_TYPE = vl('Savings', 'Cheque', 'Transmission');
const ACCOUNT_REL = vl('Own', 'Joint', 'Third Party');
const JOB_FUNC_EQUITY = vl('Core', 'Support');
const OCC_LEVEL_EQUITY = vl('Top Mgmt', 'Senior Mgmt', 'Middle Mgmt', 'Junior Mgmt', 'Semi-Skilled', 'Unskilled');
const ACCOUNT_OPT = vl('Labour', 'Supervisor', 'Sales', 'Office Assistant', 'Management');
const UIF_STATUS = vl('UIF', 'Government', 'Learner (N/A March 2018)', 'Repatriated (N/A March 2018)', 'Temporary', 'Independent Contractor', 'Legal Entity');
const JOB_GRADE_NBC = vl('GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5', 'GRADE 8', 'GRADE 10', 'GRADE 14', 'SECURITY OFFICER - GRADE I', 'SECURITY OFFICER - GRADE II', 'SECURITY OFFICER - GRADE III');
const COST_DEPT = vl('General', 'Integrated Contracts', 'Office', 'SALES', 'FEL', 'SKIP', 'RORO', 'REL', 'LDV', 'Outside Hire', 'Recycling', 'Disposal', 'Treatment', 'Ind Services', 'Int Con', 'Containers', 'Crane', 'Tipper');
const COST_CENTER = vl('BARNABAS', 'DANE', 'ANDRIES', 'HARRY', 'INNOCENT', 'LUKAS', 'MARTIN', 'QUENTIN', 'RHULANI', 'RISHEN', 'ROBYN', 'ROSS', 'SHAWN', 'SIVIWE');
const CATEGORY_NBC = vl(
  'GENERAL WORKER', 'CHECKER GRADE 1', 'PACKER / LOAD1', 'MOTOR CYCLE', 'LIGHT MOTOR VEHICLE',
  'MED MOTOR VEHICLE DRIVER-ARTICULATE', 'MED MOTOR VEHICLE DRIVER-RIGID', 'HVY MOTOR VEHICLE DRVR - ARTICULATE',
  'HVY MOTOR VEHICLE DRVR - RIGID', 'EXTRA-HVY MOTOR VEHICLE - ARTICULAT', 'EXTRA-HVY MOTOR VEHICLE - RIGID',
  'ULTRA-HVY MOTOR VEHICLE DRIVER', 'TEAM LEADER', 'DESPATCH CLERK', 'GANTRY CRANE OPERATOR GRADE I',
  'GANTRY CRANE OPERATOR GRADE II', 'LOADER/OPERATOR GRADE I', 'LOADER/OPERATOR GRADE II',
  'MOBILE HOIST OPERATOR GRADE I', 'MOBILE HOIST OPERATOR GRADE II', 'STOREMAN (WORKSHOP)', 'SECURITY GUARD',
  'PACKER/LOADER GRADE I', 'SECURITY OFFICER - GRADE I', 'SECURITY OFFICE - GRADE II', 'SECURITY OFFICER - GRADE III',
  'GENERAL WORKER - REPAIR SHOP', 'ARTISAN ASSISTANT', 'SEMI-SKILLED ARTISAN', 'PACKER/LOADER GRADE II',
  'CHECKER GRADE II', 'STOREMAN (WAREHOUSE)', 'MOTOR CYCLE/MOTOR TRICYCLE DRIVER', 'VEHICLE GUARD', 'CUSTODIAN',
  'LIGHT MOTOR VEHICLE DRIVER',
);
const STATUS: Opt[] = [
  { value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On leave' },
  { value: 'suspended', label: 'Suspended' }, { value: 'terminated', label: 'Terminated' },
];

const TABS = ['Personal', 'Emergency & address', 'Banking', 'Appointment & payroll', 'Attachments', 'Others'] as const;
type Tab = (typeof TABS)[number];

export function EmployeeDetailForm({
  employee, lookups, onSaved,
}: {
  employee: EmployeeRow;
  lookups: EmployeeLookups;
  onSaved: (updated: EmployeeRow) => void;
}) {
  const [tab, setTab] = React.useState<Tab>('Personal');
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const personal: FieldDef[] = [
    { name: 'title', label: 'Title', options: TITLE },
    { name: 'initials', label: 'Initials' },
    { name: 'firstName', label: 'First name' },
    { name: 'surname', label: 'Surname' },
    { name: 'middleNames', label: 'Middle / last names' },
    { name: 'maidenName', label: 'Maiden name' },
    { name: 'knownAs', label: 'Also known as' },
    { name: 'spouseName', label: 'Spouse name' },
    { name: 'employeeNumber', label: 'Employee no.' },
    { name: 'idNumber', label: 'ID number' },
    { name: 'passportNumber', label: 'Passport number' },
    { name: 'passportCountry', label: 'Passport country' },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { name: 'gender', label: 'Gender', options: GENDER },
    { name: 'maritalStatus', label: 'Marital status', options: MARITAL },
    { name: 'ethnicity', label: 'Ethnicity', options: ETHNICITY },
    { name: 'nationality', label: 'Nationality' },
    { name: 'language', label: 'Language' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phoneMobile', label: 'Mobile' },
    { name: 'phoneHome', label: 'Home phone' },
    { name: 'phoneWork', label: 'Work phone' },
    { name: 'taxNumber', label: 'Income tax number' },
    { name: 'taxDirective', label: 'Tax directive' },
    { name: 'skillLevel', label: 'Skill level', options: SKILL_LEVEL },
    { name: 'criticalSkills', label: 'Critical skills', options: CRITICAL },
  ];

  const emergency: FieldDef[] = [
    { name: 'emergencyName', label: 'Emergency contact name' },
    { name: 'emergencyCell', label: 'Emergency cell' },
    { name: 'emergencyWork', label: 'Emergency work no.' },
  ];
  const resAddress: FieldDef[] = [
    { name: 'resUnitNumber', label: 'Unit no.' }, { name: 'resStreetNumber', label: 'Street no.' },
    { name: 'resStreetName', label: 'Street name' }, { name: 'resComplex', label: 'Complex' },
    { name: 'resSuburb', label: 'Suburb' }, { name: 'resCity', label: 'City' }, { name: 'resPostalCode', label: 'Postal code' },
  ];
  const postAddress: FieldDef[] = [
    { name: 'postUnitNumber', label: 'Unit no.' }, { name: 'postStreetNumber', label: 'Street no.' },
    { name: 'postStreetName', label: 'Street name' }, { name: 'postComplex', label: 'Complex' },
    { name: 'postSuburb', label: 'Suburb' }, { name: 'postCity', label: 'City' }, { name: 'postPostalCode', label: 'Postal code' },
  ];

  const banking: FieldDef[] = [
    { name: 'paymentMethod', label: 'Payment method', options: PAYMENT },
    { name: 'bankName', label: 'Bank name' },
    { name: 'branchCode', label: 'Branch code' },
    { name: 'accountHolderName', label: 'Account holder' },
    { name: 'accountNumber', label: 'Account number' },
    { name: 'accountType', label: 'Account type', options: ACCOUNT_TYPE },
    { name: 'accountRelationship', label: 'Account relationship', options: ACCOUNT_REL },
  ];

  const appointment: FieldDef[] = [
    { name: 'hireDate', label: 'Date engaged', type: 'date' },
    { name: 'terminationDate', label: 'Termination date', type: 'date' },
    { name: 'employmentStatus', label: 'Status', options: STATUS },
    { name: 'contractType', label: 'Contract type' },
    { name: 'jobTitleId', label: 'Job title', options: lookupOpts(lookups.jobTitles), fk: true },
    { name: 'departmentId', label: 'Department', options: lookupOpts(lookups.departments), fk: true },
    { name: 'regionId', label: 'Province / region', options: lookupOpts(lookups.regions), fk: true },
    { name: 'depotId', label: 'Depot', options: lookupOpts(lookups.depots), fk: true },
    // Access stores the site NAME (not an id), so options are name-valued.
    { name: 'site', label: 'Site', options: lookups.sites.map((s) => ({ value: s.name, label: s.name })) },
    { name: 'jobGradeNbc', label: 'Job grade (NBC)', options: JOB_GRADE_NBC },
    { name: 'categoryNbc', label: 'Category (NBC)', options: CATEGORY_NBC },
    { name: 'nbcCouncilId', label: 'NBC council', options: lookupOpts(lookups.nbcCouncils), fk: true },
    { name: 'tierId', label: 'Tier', options: lookupOpts(lookups.tiers), fk: true },
    { name: 'patersonGradeId', label: 'Paterson grade', options: lookupOpts(lookups.patersonGrades), fk: true },
    { name: 'eeGroupId', label: 'EE group', options: lookupOpts(lookups.eeGroups), fk: true },
    { name: 'jobFunctionalityEquity', label: 'Job functionality (equity)', options: JOB_FUNC_EQUITY },
    { name: 'occupationalLevelEquity', label: 'Occupational level (equity)', options: OCC_LEVEL_EQUITY },
    { name: 'account', label: 'Account', options: ACCOUNT_OPT },
    { name: 'costDepartment', label: 'Cost department', options: COST_DEPT },
    { name: 'costCenter', label: 'Cost centre', options: COST_CENTER },
    { name: 'ratePerHour', label: 'Rate per hour', type: 'number' },
    { name: 'monthlySalary', label: 'Monthly salary', type: 'number' },
    { name: 'remunerationPerAnnum', label: 'Remuneration p.a.', type: 'number' },
    { name: 'hoursPerMonth', label: 'Hours / month', type: 'number' },
    { name: 'hoursPerDay', label: 'Hours / day', type: 'number' },
    { name: 'annualLeaveEntitlement', label: 'Annual leave entitlement', type: 'number' },
    { name: 'uifStatus', label: 'UIF status', options: UIF_STATUS },
    { name: 'taxStatusId', label: 'Tax status', options: lookupOpts(lookups.taxStatuses), fk: true },
    { name: 'medicalAidPlan', label: 'Medical aid plan' },
    { name: 'medicalAidAmount', label: 'Medical aid amount', type: 'number' },
    { name: 'vitalityAmount', label: 'Vitality amount', type: 'number' },
    { name: 'momentum', label: 'Momentum' },
    { name: 'momentumDate', label: 'Momentum date', type: 'date' },
    { name: 'momentumAmount', label: 'Momentum amount', type: 'number' },
  ];

  const others: FieldDef[] = [
    { name: 'lineManagerId', label: 'Line manager', options: lookups.managers.map((m) => ({ value: m.id, label: m.name })), fk: true },
    { name: 'currentPosition', label: 'Current position' },
    { name: 'compliance', label: 'Compliance' },
    { name: 'excoApproval', label: 'EXCO approval' },
    { name: 'eeCommitteeRep', label: 'EE committee rep' },
    { name: 'approval', label: 'Approval' },
  ];

  const allFields = [...personal, ...emergency, ...resAddress, ...postAddress, ...banking, ...appointment, ...others];

  const form = useForm({
    resolver: zodResolver(EmployeeCreate) as never,
    defaultValues: Object.fromEntries(
      allFields.concat({ name: 'notes', label: 'Notes' }).map((f) => {
        const v = (employee as Record<string, unknown>)[f.name];
        const value = f.type === 'date' ? day(v as string)
          : f.type === 'number' ? numStr(v as number)
          : (v ?? '');
        return [f.name, value as string];
      }),
    ),
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = await employeesApi.update(employee.id, { ...values, expectedUpdatedAt: employee.updatedAt } as never);
    if (r.ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      return onSaved(r.value as EmployeeRow);
    }
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
      setServerError('Please fix the highlighted fields.');
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const renderField = (f: FieldDef) => {
    // Keep an imported value visible even if it isn't one of the canonical options.
    let options = f.options;
    if (options && !f.fk) {
      const current = (employee as Record<string, unknown>)[f.name];
      if (typeof current === 'string' && current && !options.some((o) => o.value === current)) {
        options = [{ value: current, label: current }, ...options];
      }
    }
    return (
      <FormField key={f.name} label={f.label} error={err[f.name]?.message}>
        {options ? (
          <Select {...form.register(f.name)}>
            <option value="">—</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ) : (
          <Input type={f.type ?? 'text'} step={f.type === 'number' ? '0.01' : undefined} {...form.register(f.name)} />
        )}
      </FormField>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={cn(tab !== 'Personal' && 'hidden')}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{personal.map(renderField)}</div>
      </div>

      <div className={cn(tab !== 'Emergency & address' && 'hidden', 'space-y-6')}>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Emergency contact</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{emergency.map(renderField)}</div>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Residential address</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{resAddress.map(renderField)}</div>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Postal address</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{postAddress.map(renderField)}</div>
        </section>
      </div>

      <div className={cn(tab !== 'Banking' && 'hidden')}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{banking.map(renderField)}</div>
      </div>

      <div className={cn(tab !== 'Appointment & payroll' && 'hidden')}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{appointment.map(renderField)}</div>
      </div>

      {/* Attachments is a self-contained uploader (not part of this form). */}
      <div className={cn(tab !== 'Attachments' && 'hidden')}>
        <EntityAttachments api={employeeAttachmentsApi} parentId={employee.id} queryScope="employee" />
      </div>

      <div className={cn(tab !== 'Others' && 'hidden', 'space-y-4')}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{others.map(renderField)}</div>
        <FormField label="Notes" error={err.notes?.message}>
          <Textarea {...form.register('notes')} rows={4} />
        </FormField>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t bg-card px-6 py-3">
        {savedFlash && <span className="text-sm text-green-600">Saved ✓</span>}
        {tab === 'Attachments'
          ? <span className="text-xs text-muted-foreground">Attachments save immediately on upload.</span>
          : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          )}
      </div>
    </form>
  );
}
