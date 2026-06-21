'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarSchemeCreate } from '@/lib/api/contracts/expenses';
import type { CarSchemeRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { carSchemeApi } from '@/lib/api/expenses-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/numbers/uuids on submit. */
type FormValues = {
  employeeId: string; registration: string; makeModel: string; year: string;
  monthlyAllowance: string; startDate: string; endDate: string; status: string; notes: string;
};

export function CarSchemeForm({
  scheme, employees, onSaved, onCancel,
}: {
  scheme?: CarSchemeRow | null;
  employees: EmployeeRow[];
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
      status: scheme?.status ?? 'active',
      notes: scheme?.notes ?? '',
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
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="ended">Ended</option>
          </Select>
        </F>
        <F label="Registration" error={err.registration?.message}><Input {...form.register('registration')} /></F>
        <F label="Make/model" error={err.makeModel?.message}><Input {...form.register('makeModel')} /></F>
        <F label="Year" error={err.year?.message}><Input {...form.register('year')} /></F>
        <F label="Monthly allowance" error={err.monthlyAllowance?.message}>
          <Input type="number" step="0.01" {...form.register('monthlyAllowance')} />
        </F>
        <F label="Start date" error={err.startDate?.message}><Input type="date" {...form.register('startDate')} /></F>
        <F label="End date" error={err.endDate?.message}><Input type="date" {...form.register('endDate')} /></F>
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
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
