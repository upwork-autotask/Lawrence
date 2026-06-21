'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrainingInternalCreate } from '@/lib/api/contracts/training';
import type { TrainingInternalRow, TrainingRow } from '@/lib/api/contracts/training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { trainingInternalApi } from '@/lib/api/training-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; trainings: TrainingRow[] };

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const num = (n: number | null | undefined) => (n != null ? String(n) : '');

/** Form values are all strings (HTML inputs); Zod coerces numbers/uuids/dates on submit. */
type FormValues = {
  trainingId: string; employeeId: string; scheduledDate: string;
  startedAt: string; completedAt: string; score: string;
  status: string; approvalStatus: string; notes: string;
};

export function TrainingInternalForm({
  record, options, onSaved, onCancel,
}: {
  record?: TrainingInternalRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(TrainingInternalCreate) as never,
    defaultValues: {
      trainingId: record?.trainingId ?? '',
      employeeId: record?.employeeId ?? '',
      scheduledDate: day(record?.scheduledDate),
      startedAt: day(record?.startedAt),
      completedAt: day(record?.completedAt),
      score: num(record?.score),
      status: record?.status ?? 'scheduled',
      approvalStatus: record?.approvalStatus ?? 'pending',
      notes: record?.notes ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = record
      ? await trainingInternalApi.update(record.id, { ...values, expectedUpdatedAt: record.updatedAt } as never)
      : await trainingInternalApi.create(values as never);
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
        <F label="Course" error={err.trainingId?.message}>
          <Select {...form.register('trainingId')}>
            <option value="">—</option>
            {options.trainings.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </F>
        <F label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Scheduled date" error={err.scheduledDate?.message}>
          <Input type="date" {...form.register('scheduledDate')} />
        </F>
        <F label="Started at" error={err.startedAt?.message}>
          <Input type="date" {...form.register('startedAt')} />
        </F>
        <F label="Completed at" error={err.completedAt?.message}>
          <Input type="date" {...form.register('completedAt')} />
        </F>
        <F label="Score" error={err.score?.message}>
          <Input type="number" step="any" {...form.register('score')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </F>
        <F label="Approval" error={err.approvalStatus?.message}>
          <Select {...form.register('approvalStatus')}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </F>
      </div>
      <F label="Notes" error={err.notes?.message}>
        <Textarea {...form.register('notes')} />
      </F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : record ? 'Save changes' : 'Create record'}
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
