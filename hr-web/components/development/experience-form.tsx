'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DevExpCreate } from '@/lib/api/contracts/development';
import type { DevExperienceRow } from '@/lib/api/contracts/development';
import { devExperienceApi } from '@/lib/api/development-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

type FormValues = {
  experienceType: string; description: string; startDate: string;
  endDate: string; status: string; outcome: string;
};

const STATUSES = ['planned', 'in_progress', 'completed', 'withdrawn'];

export function ExperienceForm({
  planId, experience, onSaved, onCancel,
}: {
  planId: string;
  experience?: DevExperienceRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(DevExpCreate.omit({ planId: true })) as never,
    defaultValues: {
      experienceType: experience?.experienceType ?? '',
      description: experience?.description ?? '',
      startDate: day(experience?.startDate),
      endDate: day(experience?.endDate),
      status: experience?.status ?? 'planned',
      outcome: experience?.outcome ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = experience
      ? await devExperienceApi.update(experience.id, { ...values, expectedUpdatedAt: experience.updatedAt } as never)
      : await devExperienceApi.create({ ...values, planId } as never);
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
        <F label="Experience type" error={err.experienceType?.message}>
          <Input {...form.register('experienceType')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
        <F label="Start date" error={err.startDate?.message}>
          <Input type="date" {...form.register('startDate')} />
        </F>
        <F label="End date" error={err.endDate?.message}>
          <Input type="date" {...form.register('endDate')} />
        </F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
      <F label="Outcome" error={err.outcome?.message}><Textarea {...form.register('outcome')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : experience ? 'Save changes' : 'Add experience'}
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
