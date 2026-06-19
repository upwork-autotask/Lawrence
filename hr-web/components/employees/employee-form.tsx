'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeCreate } from '@/lib/api/contracts/employees';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { employeesApi } from '@/lib/api/resources';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Lookups = { departments: LookupRow[]; jobTitles: LookupRow[]; regions: LookupRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/uuids on submit. */
type FormValues = {
  employeeNumber: string; firstName: string; surname: string; knownAs: string;
  email: string; phoneMobile: string; idNumber: string; dateOfBirth: string;
  gender: string; hireDate: string; employmentStatus: string;
  departmentId: string; jobTitleId: string; regionId: string; notes: string;
};

export function EmployeeForm({
  employee, lookups, onSaved, onCancel,
}: {
  employee?: EmployeeRow | null;
  lookups: Lookups;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(EmployeeCreate) as never,
    defaultValues: {
      employeeNumber: employee?.employeeNumber ?? '',
      firstName: employee?.firstName ?? '',
      surname: employee?.surname ?? '',
      knownAs: employee?.knownAs ?? '',
      email: employee?.email ?? '',
      phoneMobile: employee?.phoneMobile ?? '',
      idNumber: employee?.idNumber ?? '',
      dateOfBirth: day(employee?.dateOfBirth),
      gender: employee?.gender ?? '',
      hireDate: day(employee?.hireDate),
      employmentStatus: employee?.employmentStatus ?? 'active',
      departmentId: employee?.departmentId ?? '',
      jobTitleId: employee?.jobTitleId ?? '',
      regionId: employee?.regionId ?? '',
      notes: employee?.notes ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = employee
      ? await employeesApi.update(employee.id, { ...values, expectedUpdatedAt: employee.updatedAt } as never)
      : await employeesApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Employee no." error={err.employeeNumber?.message}><Input {...form.register('employeeNumber')} /></F>
        <F label="Status" error={err.employmentStatus?.message}>
          <Select {...form.register('employmentStatus')}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
            <option value="on_leave">On leave</option>
          </Select>
        </F>
        <F label="First name" error={err.firstName?.message}><Input {...form.register('firstName')} /></F>
        <F label="Surname" error={err.surname?.message}><Input {...form.register('surname')} /></F>
        <F label="Known as" error={err.knownAs?.message}><Input {...form.register('knownAs')} /></F>
        <F label="ID number" error={err.idNumber?.message}><Input {...form.register('idNumber')} /></F>
        <F label="Email" error={err.email?.message}><Input type="email" {...form.register('email')} /></F>
        <F label="Mobile" error={err.phoneMobile?.message}><Input {...form.register('phoneMobile')} /></F>
        <F label="Date of birth" error={err.dateOfBirth?.message}><Input type="date" {...form.register('dateOfBirth')} /></F>
        <F label="Hire date" error={err.hireDate?.message}><Input type="date" {...form.register('hireDate')} /></F>
        <F label="Department" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}>
            <option value="">—</option>
            {lookups.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </F>
        <F label="Job title" error={err.jobTitleId?.message}>
          <Select {...form.register('jobTitleId')}>
            <option value="">—</option>
            {lookups.jobTitles.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </F>
        <F label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}>
            <option value="">—</option>
            {lookups.regions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </F>
      </div>
      <F label="Notes" error={err.notes?.message}><Textarea {...form.register('notes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : employee ? 'Save changes' : 'Create employee'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
