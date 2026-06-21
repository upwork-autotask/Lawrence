'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JdTrainingCreate } from '@/lib/api/contracts/job-descriptions';
import type { TrainingRow } from '@/lib/api/contracts/training';
import { jdTrainingInternalApi, jdTrainingExternalApi } from '@/lib/api/job-descriptions-client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field } from './field';

export type JdTrainingRow = {
  id: string;
  jdId: string;
  trainingId: string | null;
  required: boolean;
  frequency: string | null;
  sortOrder: number;
  updatedAt: string;
};

type FormValues = { trainingId: string; required: string; frequency: string; sortOrder: string };

export function JdTrainingForm({
  kind, jdId, row, trainings, onSaved, onCancel,
}: {
  kind: 'internal' | 'external';
  jdId: string;
  row?: JdTrainingRow | null;
  trainings: TrainingRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const api = kind === 'internal' ? jdTrainingInternalApi : jdTrainingExternalApi;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(JdTrainingCreate.omit({ jdId: true })) as never,
    defaultValues: {
      trainingId: row?.trainingId ?? '',
      required: row?.required ? 'true' : 'false',
      frequency: row?.frequency ?? '',
      sortOrder: row?.sortOrder != null ? String(row.sortOrder) : '0',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await api.update(row.id, { ...values, jdId, expectedUpdatedAt: row.updatedAt } as never)
      : await api.create({ ...values, jdId } as never);
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
      <Field label="Training" error={err.trainingId?.message}>
        <Select {...form.register('trainingId')}>
          <option value="">—</option>
          {trainings.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Required" error={err.required?.message}>
          <Select {...form.register('required')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </Field>
        <Field label="Frequency" error={err.frequency?.message}>
          <Input {...form.register('frequency')} />
        </Field>
      </div>
      <Field label="Sort order" error={err.sortOrder?.message}>
        <Input type="number" step="1" {...form.register('sortOrder')} />
      </Field>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : row ? 'Save changes' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
