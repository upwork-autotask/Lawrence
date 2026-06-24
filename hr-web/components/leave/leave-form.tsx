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

  // Auto-populate days requested from the date range (inclusive). Skip the first
  // run so an existing application's stored value isn't overwritten on open;
  // recompute whenever the user changes a date thereafter. Still editable.
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
        const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
        form.setValue('daysRequested', String(days), { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Approver = the selected employee's line manager.
  const selectedEmployeeId = form.watch('employeeId');
  const approver = React.useMemo(() => {
    const emp = options.employees.find((e) => e.id === selectedEmployeeId);
    if (!emp?.lineManagerId) return null;
    return options.employees.find((e) => e.id === emp.lineManagerId) ?? null;
  }, [selectedEmployeeId, options.employees]);

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
          <p className="mt-1 text-xs text-muted-foreground">Auto-calculated from the dates (inclusive) — adjust for half-days if needed.</p>
        </F>
        <div className="space-y-1">
          <Label>Approver (line manager)</Label>
          <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
            {approver ? `${approver.firstName} ${approver.surname}` : '— not assigned'}
          </div>
        </div>
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
