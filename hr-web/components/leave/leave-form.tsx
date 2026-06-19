'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeaveFormCreate } from '@/lib/api/contracts/leave';
import type { LeaveFormRow, LeaveTypeRow } from '@/lib/api/contracts/leave';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { leaveApi } from '@/lib/api/leave-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; leaveTypes: LeaveTypeRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/numbers/uuids on submit. */
type FormValues = {
  employeeId: string; leaveTypeId: string; startDate: string; endDate: string;
  daysRequested: string; reason: string;
};

export function LeaveForm({
  leave, options, onSaved, onCancel,
}: {
  leave?: LeaveFormRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(LeaveFormCreate) as never,
    defaultValues: {
      employeeId: leave?.employeeId ?? '',
      leaveTypeId: leave?.leaveTypeId ?? '',
      startDate: day(leave?.startDate),
      endDate: day(leave?.endDate),
      daysRequested: leave?.daysRequested != null ? String(leave.daysRequested) : '',
      reason: leave?.reason ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = leave
      ? await leaveApi.update(leave.id, { ...values, expectedUpdatedAt: leave.updatedAt } as never)
      : await leaveApi.create(values as never);
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
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Leave type" error={err.leaveTypeId?.message}>
          <Select {...form.register('leaveTypeId')}>
            <option value="">—</option>
            {options.leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </F>
        <F label="Start date" error={err.startDate?.message}><Input type="date" {...form.register('startDate')} /></F>
        <F label="End date" error={err.endDate?.message}><Input type="date" {...form.register('endDate')} /></F>
        <F label="Days requested" error={err.daysRequested?.message}>
          <Input type="number" step="0.5" {...form.register('daysRequested')} />
        </F>
      </div>
      <F label="Reason" error={err.reason?.message}><Textarea {...form.register('reason')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : leave ? 'Save changes' : 'Create application'}
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
