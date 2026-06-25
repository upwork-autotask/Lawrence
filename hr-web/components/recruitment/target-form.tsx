'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TargetCreate } from '@/lib/api/contracts/ee';
import type { TargetRow } from '@/lib/api/contracts/ee';
import { recruitmentTargetsApi } from '@/lib/api/ee-client';
import { OCC_LEVELS, EMP_TYPES, GENDERS, RACES } from '@/lib/ee-options';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const opts = (vals: string[]) => vals.map((v) => <option key={v} value={v}>{v}</option>);

export function TargetForm({
  target, onSaved, onCancel,
}: {
  target?: TargetRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(TargetCreate) as never,
    defaultValues: {
      periodYear: target?.periodYear != null ? String(target.periodYear) : String(new Date().getFullYear()),
      dueDate: day(target?.dueDate),
      occupationalLevel: target?.occupationalLevel ?? '',
      employmentType: target?.employmentType ?? '',
      gender: target?.gender ?? '',
      race: target?.race ?? '',
      targetCount: target?.targetCount != null ? String(target.targetCount) : '0',
      achievedCount: target?.achievedCount != null ? String(target.achievedCount) : '0',
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = target
      ? await recruitmentTargetsApi.update(target.id, { ...values, expectedUpdatedAt: target.updatedAt } as never)
      : await recruitmentTargetsApi.create(values as never);
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
        <FormField label="Year" error={err.periodYear?.message}><Input type="number" {...reg('periodYear')} /></FormField>
        <FormField label="Due date" error={err.dueDate?.message}><Input type="date" {...reg('dueDate')} /></FormField>
        <FormField label="Occupational level" error={err.occupationalLevel?.message}>
          <Select {...reg('occupationalLevel')}><option value="">—</option>{opts(OCC_LEVELS)}</Select>
        </FormField>
        <FormField label="Employment type" error={err.employmentType?.message}>
          <Select {...reg('employmentType')}><option value="">—</option>{opts(EMP_TYPES)}</Select>
        </FormField>
        <FormField label="Gender" error={err.gender?.message}>
          <Select {...reg('gender')}><option value="">—</option>{opts(GENDERS)}</Select>
        </FormField>
        <FormField label="Race" error={err.race?.message}>
          <Select {...reg('race')}><option value="">—</option>{opts(RACES)}</Select>
        </FormField>
        <FormField label="Target (value)" error={err.targetCount?.message}><Input type="number" {...reg('targetCount')} /></FormField>
        <FormField label="Achieved" error={err.achievedCount?.message}><Input type="number" {...reg('achievedCount')} /></FormField>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : target ? 'Save changes' : 'Add target'}
        </Button>
      </div>
    </form>
  );
}
