'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaseCreate } from '@/lib/api/contracts/disciplinary';
import type { CaseRow, OffenceRow, ActionRow } from '@/lib/api/contracts/disciplinary';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { disciplinaryApi } from '@/lib/api/disciplinary-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Lookups = { employees: EmployeeRow[]; offences: OffenceRow[]; actions: ActionRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/uuids on submit. */
type FormValues = {
  caseNumber: string; employeeId: string; offenceId: string; actionId: string;
  incidentDate: string; reportedDate: string; description: string; status: string;
  hearingDate: string; outcome: string; witnesses: string;
};

export function CaseForm({
  caseRecord, lookups, onSaved, onCancel,
}: {
  caseRecord?: CaseRow | null;
  lookups: Lookups;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CaseCreate) as never,
    defaultValues: {
      caseNumber: caseRecord?.caseNumber ?? '',
      employeeId: caseRecord?.employeeId ?? '',
      offenceId: caseRecord?.offenceId ?? '',
      actionId: caseRecord?.actionId ?? '',
      incidentDate: day(caseRecord?.incidentDate),
      reportedDate: day(caseRecord?.reportedDate),
      description: caseRecord?.description ?? '',
      status: caseRecord?.status ?? 'open',
      hearingDate: day(caseRecord?.hearingDate),
      outcome: caseRecord?.outcome ?? '',
      witnesses: caseRecord?.witnesses ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = caseRecord
      ? await disciplinaryApi.update(caseRecord.id, { ...values, expectedUpdatedAt: caseRecord.updatedAt } as never)
      : await disciplinaryApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const empName = (e: EmployeeRow) => `${e.firstName} ${e.surname}`;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Case no." error={err.caseNumber?.message}><Input {...form.register('caseNumber')} /></F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="open">Open</option>
            <option value="under_investigation">Under investigation</option>
            <option value="hearing_scheduled">Hearing scheduled</option>
            <option value="closed">Closed</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </F>
        <F label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {lookups.employees.map((e) => <option key={e.id} value={e.id}>{empName(e)}</option>)}
          </Select>
        </F>
        <F label="Offence" error={err.offenceId?.message}>
          <Select {...form.register('offenceId')}>
            <option value="">—</option>
            {lookups.offences.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </F>
        <F label="Action" error={err.actionId?.message}>
          <Select {...form.register('actionId')}>
            <option value="">—</option>
            {lookups.actions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </F>
        <F label="Incident date" error={err.incidentDate?.message}><Input type="date" {...form.register('incidentDate')} /></F>
        <F label="Reported date" error={err.reportedDate?.message}><Input type="date" {...form.register('reportedDate')} /></F>
        <F label="Hearing date" error={err.hearingDate?.message}><Input type="date" {...form.register('hearingDate')} /></F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
      <F label="Outcome" error={err.outcome?.message}><Textarea {...form.register('outcome')} /></F>
      <F label="Witnesses" error={err.witnesses?.message}><Textarea {...form.register('witnesses')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : caseRecord ? 'Save changes' : 'Create case'}
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
