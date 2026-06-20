'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LookupCreate } from '@/lib/api/contracts/lookups';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { lookupsApi } from '@/lib/api/resources';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type FormValues = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  isActive: string;
};

export function LookupForm({
  table,
  row,
  onSaved,
  onCancel,
}: {
  table: string;
  row?: LookupRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(LookupCreate) as never,
    defaultValues: {
      name: row?.name ?? '',
      code: row?.code ?? '',
      description: row?.description ?? '',
      sortOrder: String(row?.sortOrder ?? 0),
      isActive: String(row?.isActive ?? true),
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await lookupsApi.update(table, row.id, { ...values, expectedUpdatedAt: row.updatedAt })
      : await lookupsApi.create(table, values);
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
        <F label="Sort order" error={err.sortOrder?.message}><Input type="number" {...form.register('sortOrder')} /></F>
        <F label="Active" error={err.isActive?.message}>
          <Select {...form.register('isActive')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
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

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
