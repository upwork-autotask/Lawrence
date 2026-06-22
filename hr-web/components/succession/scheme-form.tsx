'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SchemeCreate } from '@/lib/api/contracts/succession';
import type { SchemeRow } from '@/lib/api/contracts/succession';
import { successionSchemesApi } from '@/lib/api/succession-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  name: string; code: string; description: string; isActive: string; sortOrder: string;
};

export function SchemeForm({
  scheme, onSaved, onCancel,
}: {
  scheme?: SchemeRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(SchemeCreate) as never,
    defaultValues: {
      name: scheme?.name ?? '',
      code: scheme?.code ?? '',
      description: scheme?.description ?? '',
      isActive: scheme ? (scheme.isActive ? 'true' : 'false') : 'true',
      sortOrder: scheme?.sortOrder != null ? String(scheme.sortOrder) : '0',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = scheme
      ? await successionSchemesApi.update(scheme.id, { ...values, expectedUpdatedAt: scheme.updatedAt } as never)
      : await successionSchemesApi.create(values as never);
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
        <F label="Sort order" error={err.sortOrder?.message}>
          <Input type="number" {...form.register('sortOrder')} />
        </F>
        <F label="Active" error={err.isActive?.message}>
          <Select {...form.register('isActive')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : scheme ? 'Save changes' : 'Create scheme'}
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
