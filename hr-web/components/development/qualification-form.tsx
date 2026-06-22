'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QualCreate } from '@/lib/api/contracts/development';
import type { QualDevRow } from '@/lib/api/contracts/development';
import { devQualsApi } from '@/lib/api/development-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

type FormValues = {
  qualificationName: string; institution: string; startDate: string;
  targetCompletionDate: string; completionDate: string; status: string;
  cost: string; notes: string;
};

const STATUSES = ['planned', 'enrolled', 'in_progress', 'completed', 'withdrawn'];

export function QualificationForm({
  planId, qual, onSaved, onCancel,
}: {
  planId: string;
  qual?: QualDevRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(QualCreate.omit({ planId: true })) as never,
    defaultValues: {
      qualificationName: qual?.qualificationName ?? '',
      institution: qual?.institution ?? '',
      startDate: day(qual?.startDate),
      targetCompletionDate: day(qual?.targetCompletionDate),
      completionDate: day(qual?.completionDate),
      status: qual?.status ?? 'planned',
      cost: qual?.cost != null ? String(qual.cost) : '',
      notes: qual?.notes ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = qual
      ? await devQualsApi.update(qual.id, { ...values, expectedUpdatedAt: qual.updatedAt } as never)
      : await devQualsApi.create({ ...values, planId } as never);
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
        <F label="Qualification name" error={err.qualificationName?.message}>
          <Input {...form.register('qualificationName')} />
        </F>
        <F label="Institution" error={err.institution?.message}>
          <Input {...form.register('institution')} />
        </F>
        <F label="Start date" error={err.startDate?.message}>
          <Input type="date" {...form.register('startDate')} />
        </F>
        <F label="Target completion date" error={err.targetCompletionDate?.message}>
          <Input type="date" {...form.register('targetCompletionDate')} />
        </F>
        <F label="Completion date" error={err.completionDate?.message}>
          <Input type="date" {...form.register('completionDate')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
        <F label="Cost" error={err.cost?.message}>
          <Input type="number" step="0.01" {...form.register('cost')} />
        </F>
      </div>
      <F label="Notes" error={err.notes?.message}><Textarea {...form.register('notes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : qual ? 'Save changes' : 'Add qualification'}
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
