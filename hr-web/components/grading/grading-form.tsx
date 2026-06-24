'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GradingCreate } from '@/lib/api/contracts/grading';
import type { GradingRow } from '@/lib/api/contracts/grading';
import { gradingApi } from '@/lib/api/grading-client';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const numStr = (n: number | null | undefined) => (n != null ? String(n) : '');

export function GradingForm({
  row, onSaved, onCancel,
}: {
  row?: GradingRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(GradingCreate) as never,
    defaultValues: {
      scale: row?.scale ?? '',
      occLevel: row?.occLevel ?? '',
      jobTitle: row?.jobTitle ?? '',
      code: row?.code ?? '',
      patersonGrade: row?.patersonGrade ?? '',
      patersonBand: row?.patersonBand ?? '',
      minRate: numStr(row?.minRate),
      maxRate: numStr(row?.maxRate),
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = row
      ? await gradingApi.update(row.id, { ...values, expectedUpdatedAt: row.updatedAt } as never)
      : await gradingApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const reg = (n: string) => form.register(n as never);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Paterson grade" error={err.patersonGrade?.message}><Input {...reg('patersonGrade')} /></FormField>
        <FormField label="Paterson band" error={err.patersonBand?.message}><Input {...reg('patersonBand')} /></FormField>
        <FormField label="Job title" error={err.jobTitle?.message}><Input {...reg('jobTitle')} /></FormField>
        <FormField label="Occupational level" error={err.occLevel?.message}><Input {...reg('occLevel')} /></FormField>
        <FormField label="Scale" error={err.scale?.message}><Input {...reg('scale')} /></FormField>
        <FormField label="Code" error={err.code?.message}><Input {...reg('code')} /></FormField>
        <FormField label="Min rate" error={err.minRate?.message}><Input type="number" step="0.01" {...reg('minRate')} /></FormField>
        <FormField label="Max rate" error={err.maxRate?.message}><Input type="number" step="0.01" {...reg('maxRate')} /></FormField>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : row ? 'Save changes' : 'Add grade'}
        </Button>
      </div>
    </form>
  );
}
