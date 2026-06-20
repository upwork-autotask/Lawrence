'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrainingCreate } from '@/lib/api/contracts/training';
import type { TrainingRow } from '@/lib/api/contracts/training';
import { trainingsApi } from '@/lib/api/training-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/** Form values are all strings (HTML inputs); Zod coerces numbers/booleans on submit. */
type FormValues = {
  code: string; name: string; kind: string; provider: string;
  durationHours: string; cost: string; description: string;
  isActive: string; requiresQuiz: string;
};

export function TrainingForm({
  training, onSaved, onCancel,
}: {
  training?: TrainingRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(TrainingCreate) as never,
    defaultValues: {
      code: training?.code ?? '',
      name: training?.name ?? '',
      kind: training?.kind ?? 'internal',
      provider: training?.provider ?? '',
      durationHours: training?.durationHours != null ? String(training.durationHours) : '',
      cost: training?.cost != null ? String(training.cost) : '',
      description: training?.description ?? '',
      isActive: training ? String(training.isActive) : 'true',
      requiresQuiz: training ? String(training.requiresQuiz) : 'false',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = training
      ? await trainingsApi.update(training.id, { ...values, expectedUpdatedAt: training.updatedAt } as never)
      : await trainingsApi.create(values as never);
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
      <div className="grid grid-cols-2 gap-4">
        <F label="Name" error={err.name?.message}><Input {...form.register('name')} /></F>
        <F label="Code" error={err.code?.message}><Input {...form.register('code')} /></F>
        <F label="Kind" error={err.kind?.message}>
          <Select {...form.register('kind')}>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="blended">Blended</option>
          </Select>
        </F>
        <F label="Provider" error={err.provider?.message}><Input {...form.register('provider')} /></F>
        <F label="Duration (hours)" error={err.durationHours?.message}>
          <Input type="number" step="0.5" {...form.register('durationHours')} />
        </F>
        <F label="Cost" error={err.cost?.message}>
          <Input type="number" step="0.01" {...form.register('cost')} />
        </F>
        <F label="Active" error={err.isActive?.message}>
          <Select {...form.register('isActive')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </F>
        <F label="Requires quiz" error={err.requiresQuiz?.message}>
          <Select {...form.register('requiresQuiz')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </Select>
        </F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : training ? 'Save changes' : 'Create training'}
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
