'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarSchemeCreate } from '@/lib/api/contracts/expenses';
import type { CarSchemeRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { carSchemeApi } from '@/lib/api/expenses-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const num = (n: number | null | undefined) => (n != null ? String(n) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/numbers/uuids on submit. */
type FormValues = {
  employeeId: string; registration: string; makeModel: string; year: string;
  monthlyAllowance: string; startDate: string; endDate: string; status: string; notes: string;
  cMonth: string; kmStart: string; kmEnd: string; totalKm: string;
  bkm: string; pkm: string; ratePerKm: string; totalAmount: string;
  regionId: string; departmentId: string;
};

export function CarSchemeForm({
  scheme, employees, regions, departments, onSaved, onCancel,
}: {
  scheme?: CarSchemeRow | null;
  employees: EmployeeRow[];
  regions: LookupRow[];
  departments: LookupRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CarSchemeCreate) as never,
    defaultValues: {
      employeeId: scheme?.employeeId ?? '',
      registration: scheme?.registration ?? '',
      makeModel: scheme?.makeModel ?? '',
      year: scheme?.year ?? '',
      monthlyAllowance: scheme?.monthlyAllowance != null ? String(scheme.monthlyAllowance) : '',
      startDate: day(scheme?.startDate),
      endDate: day(scheme?.endDate),
      status: scheme?.status ?? 'Pending',
      notes: scheme?.notes ?? '',
      cMonth: day(scheme?.cMonth),
      kmStart: num(scheme?.kmStart),
      kmEnd: num(scheme?.kmEnd),
      totalKm: num(scheme?.totalKm),
      bkm: num(scheme?.bkm),
      pkm: num(scheme?.pkm),
      ratePerKm: num(scheme?.ratePerKm),
      totalAmount: num(scheme?.totalAmount),
      regionId: scheme?.regionId ?? '',
      departmentId: scheme?.departmentId ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = scheme
      ? await carSchemeApi.update(scheme.id, { ...values, expectedUpdatedAt: scheme.updatedAt } as never)
      : await carSchemeApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const employeeName = (e: EmployeeRow) => `${e.firstName} ${e.surname}`;
  const lookupOpts = (rows: LookupRow[]) =>
    rows.map((l) => <option key={l.id} value={l.id}>{l.name}</option>);

  // Access status value list is Pending/Approved/Rejected; keep any imported
  // value (e.g. legacy active/suspended/ended) selectable so it isn't lost.
  const currentStatus = scheme?.status ?? '';
  const knownStatuses = ['Pending', 'Approved', 'Rejected'];

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {currentStatus && !knownStatuses.includes(currentStatus) && (
              <option value={currentStatus}>{currentStatus}</option>
            )}
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </Select>
        </F>
        <F label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}><option value="">—</option>{lookupOpts(regions)}</Select>
        </F>
        <F label="Department" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}><option value="">—</option>{lookupOpts(departments)}</Select>
        </F>
        <F label="Registration" error={err.registration?.message}><Input {...form.register('registration')} /></F>
        <F label="Make/model" error={err.makeModel?.message}><Input {...form.register('makeModel')} /></F>
        <F label="Year" error={err.year?.message}><Input {...form.register('year')} /></F>
        <F label="Monthly allowance" error={err.monthlyAllowance?.message}>
          <Input type="number" step="0.01" {...form.register('monthlyAllowance')} />
        </F>
        <F label="Month" error={err.cMonth?.message}><Input type="date" {...form.register('cMonth')} /></F>
        <F label="Start date" error={err.startDate?.message}><Input type="date" {...form.register('startDate')} /></F>
        <F label="End date" error={err.endDate?.message}><Input type="date" {...form.register('endDate')} /></F>
        <F label="KM start" error={err.kmStart?.message}>
          <Input type="number" step="0.01" {...form.register('kmStart')} />
        </F>
        <F label="KM end" error={err.kmEnd?.message}>
          <Input type="number" step="0.01" {...form.register('kmEnd')} />
        </F>
        <F label="Total km" error={err.totalKm?.message}>
          <Input type="number" step="0.01" {...form.register('totalKm')} />
        </F>
        <F label="Bkm" error={err.bkm?.message}>
          <Input type="number" step="0.01" {...form.register('bkm')} />
        </F>
        <F label="Pkm" error={err.pkm?.message}>
          <Input type="number" step="0.01" {...form.register('pkm')} />
        </F>
        <F label="Rate per km" error={err.ratePerKm?.message}>
          <Input type="number" step="0.01" {...form.register('ratePerKm')} />
        </F>
        <F label="Total amount" error={err.totalAmount?.message}>
          <Input type="number" step="0.01" {...form.register('totalAmount')} />
        </F>
      </div>
      <F label="Notes" error={err.notes?.message}><Textarea {...form.register('notes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : scheme ? 'Save changes' : 'Create car scheme'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const child = React.isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? generatedId,
        "aria-describedby": errorId,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1">
      <Label htmlFor={generatedId}>{label}</Label>
      {child}
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
