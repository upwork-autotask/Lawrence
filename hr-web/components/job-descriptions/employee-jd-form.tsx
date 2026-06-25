'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeJdCreate, type EmployeeJdRow } from '@/lib/api/contracts/job-descriptions';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import type { JdRow, JdEntryRow } from '@/lib/api/contracts/job-descriptions';
import { employeeJdsApi, jdEntriesApi } from '@/lib/api/job-descriptions-client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field } from './field';

type FormValues = {
  employeeId: string;
  jdId: string;
  assignedAt: string;
  status: string;
  assignedKpa: string;
  assignedKpaJdEntryId: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function EmployeeJdForm({
  row, employees, jds, onSaved, onCancel,
}: {
  row?: EmployeeJdRow | null;
  employees: EmployeeRow[];
  jds: JdRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(EmployeeJdCreate) as never,
    defaultValues: {
      employeeId: row?.employeeId ?? '',
      jdId: row?.jdId ?? '',
      assignedAt: row?.assignedAt ? row.assignedAt.slice(0, 10) : today(),
      status: row?.status ?? 'assigned',
      assignedKpa: row?.assignedKpa ?? '',
      assignedKpaJdEntryId: row?.assignedKpaJdEntryId ?? '',
      notes: row?.notes ?? '',
    },
  });

  // KPA source = the selected JD's detail entries (Access TblJobDescriptionEntryRecord, filtered by JD).
  const jdId = form.watch('jdId');
  const entries = useQuery({
    queryKey: ['jd-entries', 'for-assignment', jdId],
    enabled: Boolean(jdId),
    queryFn: async () => {
      const r = await jdEntriesApi.list({ jdId, pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items as JdEntryRow[];
    },
  });

  // Picking a KPA entry copies its section text into the free-text label.
  function onPickEntry(e: React.ChangeEvent<HTMLSelectElement>) {
    const entryId = e.target.value;
    form.setValue('assignedKpaJdEntryId', entryId);
    const entry = entries.data?.find((x) => x.id === entryId);
    if (entry) form.setValue('assignedKpa', entry.section);
  }

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await employeeJdsApi.update(row.id, { ...values, expectedUpdatedAt: row.updatedAt } as never)
      : await employeeJdsApi.create(values as never);
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
      <Field label="Employee" error={err.employeeId?.message}>
        <Select {...form.register('employeeId')}>
          <option value="">Select employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>
          ))}
        </Select>
      </Field>

      <Field label="Job description" error={err.jdId?.message}>
        <Select
          {...form.register('jdId', {
            onChange: () => {
              // Clear KPA selection when the JD changes (entries are JD-specific).
              form.setValue('assignedKpaJdEntryId', '');
            },
          })}
        >
          <option value="">Select job description…</option>
          {jds.map((j) => (
            <option key={j.id} value={j.id}>{j.title} v{j.version}</option>
          ))}
        </Select>
      </Field>

      <Field label="Assigned KPA (from JD)" error={err.assignedKpaJdEntryId?.message}>
        <Select value={form.watch('assignedKpaJdEntryId')} onChange={onPickEntry} disabled={!jdId}>
          <option value="">
            {!jdId ? 'Select a job description first…' : entries.isLoading ? 'Loading…' : '— None / free text —'}
          </option>
          {entries.data?.map((en) => (
            <option key={en.id} value={en.id}>{en.section}</option>
          ))}
        </Select>
      </Field>

      <Field label="Assigned KPA (label)" error={err.assignedKpa?.message}>
        <Input {...form.register('assignedKpa')} placeholder="KPA label" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Assigned date" error={err.assignedAt?.message}>
          <Input type="date" {...form.register('assignedAt')} />
        </Field>
        <Field label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="assigned">Assigned</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="signed_off">Signed off</option>
          </Select>
        </Field>
      </div>

      <Field label="Notes" error={err.notes?.message}>
        <Input {...form.register('notes')} />
      </Field>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : row ? 'Save changes' : 'Assign'}
        </Button>
      </div>
    </form>
  );
}
