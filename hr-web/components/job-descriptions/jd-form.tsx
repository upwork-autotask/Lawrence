'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JdCreate } from '@/lib/api/contracts/job-descriptions';
import type { JdRow } from '@/lib/api/contracts/job-descriptions';
import { jdApi } from '@/lib/api/job-descriptions-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces numbers/dates on submit. */
type FormValues = {
  title: string; version: string; status: string;
  summary: string; reportsToTitle: string; effectiveDate: string;
};

export function JdForm({
  jd, onSaved, onCancel,
}: {
  jd?: JdRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(JdCreate) as never,
    defaultValues: {
      title: jd?.title ?? '',
      version: jd?.version != null ? String(jd.version) : '1',
      status: jd?.status ?? 'draft',
      summary: jd?.summary ?? '',
      reportsToTitle: jd?.reportsToTitle ?? '',
      effectiveDate: day(jd?.effectiveDate),
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = jd
      ? await jdApi.update(jd.id, { ...values, expectedUpdatedAt: jd.updatedAt } as never)
      : await jdApi.create(values as never);
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
      <F label="Title" error={err.title?.message}><Input {...form.register('title')} /></F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Version" error={err.version?.message}>
          <Input type="number" step="1" {...form.register('version')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </Select>
        </F>
        <F label="Reports to (title)" error={err.reportsToTitle?.message}>
          <Input {...form.register('reportsToTitle')} />
        </F>
        <F label="Effective date" error={err.effectiveDate?.message}>
          <Input type="date" {...form.register('effectiveDate')} />
        </F>
      </div>
      <F label="Summary" error={err.summary?.message}><Textarea {...form.register('summary')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : jd ? 'Save changes' : 'Create job description'}
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
