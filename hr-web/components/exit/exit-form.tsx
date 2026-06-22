'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExitCreate } from '@/lib/api/contracts/exit';
import type { ExitRecordRow, ExitReasonRow } from '@/lib/api/contracts/exit';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { exitRecordsApi } from '@/lib/api/exit-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; reasons: ExitReasonRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

const exitTypes = ['resignation', 'dismissal', 'retirement', 'retrenchment', 'end_of_contract', 'death'];
const statuses = ['initiated', 'in_progress', 'completed', 'cancelled'];

/** Form values are all strings (HTML inputs); Zod coerces dates/uuids/bools on submit. */
type FormValues = {
  employeeId: string; exitType: string; reasonId: string; noticeDate: string;
  lastWorkingDay: string; interviewDate: string; interviewNotes: string;
  rehireEligible: string; status: string;
};

export function ExitForm({
  record, options, onSaved, onCancel,
}: {
  record?: ExitRecordRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(ExitCreate) as never,
    defaultValues: {
      employeeId: record?.employeeId ?? '',
      exitType: record?.exitType ?? 'resignation',
      reasonId: record?.reasonId ?? '',
      noticeDate: day(record?.noticeDate),
      lastWorkingDay: day(record?.lastWorkingDay),
      interviewDate: day(record?.interviewDate),
      interviewNotes: record?.interviewNotes ?? '',
      rehireEligible: record?.rehireEligible ? 'true' : '',
      status: record?.status ?? 'initiated',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = record
      ? await exitRecordsApi.update(record.id, { ...values, expectedUpdatedAt: record.updatedAt } as never)
      : await exitRecordsApi.create(values as never);
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
        <F label="Exit type" error={err.exitType?.message}>
          <Select {...form.register('exitType')}>
            {exitTypes.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </F>
        <F label="Reason" error={err.reasonId?.message}>
          <Select {...form.register('reasonId')}>
            <option value="">—</option>
            {options.reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {statuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
        <F label="Notice date" error={err.noticeDate?.message}><Input type="date" {...form.register('noticeDate')} /></F>
        <F label="Last working day" error={err.lastWorkingDay?.message}><Input type="date" {...form.register('lastWorkingDay')} /></F>
        <F label="Interview date" error={err.interviewDate?.message}><Input type="date" {...form.register('interviewDate')} /></F>
        <F label="Rehire eligible" error={err.rehireEligible?.message}>
          <Select {...form.register('rehireEligible')}>
            <option value="">—</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </F>
      </div>
      <F label="Interview notes" error={err.interviewNotes?.message}><Textarea {...form.register('interviewNotes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : record ? 'Save changes' : 'Create exit record'}
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
