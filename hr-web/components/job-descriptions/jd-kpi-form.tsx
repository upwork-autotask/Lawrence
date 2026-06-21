'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JdKpiCreate } from '@/lib/api/contracts/job-descriptions';
import type { KpiRow } from '@/lib/api/contracts/performance';
import { jdKpisApi } from '@/lib/api/job-descriptions-client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field } from './field';

export type JdKpiRow = {
  id: string;
  jdId: string;
  kpiId: string | null;
  target: string | null;
  weight: number;
  sortOrder: number;
  updatedAt: string;
};

type FormValues = { kpiId: string; target: string; weight: string; sortOrder: string };

export function JdKpiForm({
  jdId, row, kpis, onSaved, onCancel,
}: {
  jdId: string;
  row?: JdKpiRow | null;
  kpis: KpiRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(JdKpiCreate.omit({ jdId: true })) as never,
    defaultValues: {
      kpiId: row?.kpiId ?? '',
      target: row?.target ?? '',
      weight: row?.weight != null ? String(row.weight) : '1',
      sortOrder: row?.sortOrder != null ? String(row.sortOrder) : '0',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await jdKpisApi.update(row.id, { ...values, jdId, expectedUpdatedAt: row.updatedAt } as never)
      : await jdKpisApi.create({ ...values, jdId } as never);
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
      <Field label="KPI" error={err.kpiId?.message}>
        <Select {...form.register('kpiId')}>
          <option value="">—</option>
          {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </Select>
      </Field>
      <Field label="Target" error={err.target?.message}>
        <Input {...form.register('target')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Weight" error={err.weight?.message}>
          <Input type="number" step="any" {...form.register('weight')} />
        </Field>
        <Field label="Sort order" error={err.sortOrder?.message}>
          <Input type="number" step="1" {...form.register('sortOrder')} />
        </Field>
      </div>
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
