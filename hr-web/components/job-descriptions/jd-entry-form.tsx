'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JdEntryCreate } from '@/lib/api/contracts/job-descriptions';
import type { JdEntryRow } from '@/lib/api/contracts/job-descriptions';
import { jdEntriesApi } from '@/lib/api/job-descriptions-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field } from './field';

type FormValues = { section: string; body: string; sortOrder: string };

export function JdEntryForm({
  jdId, row, onSaved, onCancel,
}: {
  jdId: string;
  row?: JdEntryRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(JdEntryCreate.omit({ jdId: true })) as never,
    defaultValues: {
      section: row?.section ?? '',
      body: row?.body ?? '',
      sortOrder: row?.sortOrder != null ? String(row.sortOrder) : '0',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await jdEntriesApi.update(row.id, { ...values, jdId, expectedUpdatedAt: row.updatedAt } as never)
      : await jdEntriesApi.create({ ...values, jdId } as never);
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
      <Field label="Section" error={err.section?.message}>
        <Input {...form.register('section')} />
      </Field>
      <Field label="Body" error={err.body?.message}>
        <Textarea {...form.register('body')} />
      </Field>
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
