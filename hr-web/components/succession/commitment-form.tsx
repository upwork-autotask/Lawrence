'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CommitmentCreate } from '@/lib/api/contracts/succession';
import type { SuccessionCommitmentRow } from '@/lib/api/contracts/succession';
import { successionCommitmentsApi } from '@/lib/api/succession-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const statusOptions = ['pending', 'in_progress', 'completed', 'cancelled'];

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  commitment: string; dueDate: string; status: string;
};

export function CommitmentForm({
  candidateId, commitment, onSaved, onCancel,
}: {
  candidateId: string;
  commitment?: SuccessionCommitmentRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CommitmentCreate.omit({ candidateId: true })) as never,
    defaultValues: {
      commitment: commitment?.commitment ?? '',
      dueDate: commitment?.dueDate ? commitment.dueDate.slice(0, 10) : '',
      status: commitment?.status ?? 'pending',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = commitment
      ? await successionCommitmentsApi.update(commitment.id, { ...values, expectedUpdatedAt: commitment.updatedAt } as never)
      : await successionCommitmentsApi.create({ ...values, candidateId } as never);
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
      <F label="Commitment" error={err.commitment?.message}><Textarea {...form.register('commitment')} /></F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Due date" error={err.dueDate?.message}>
          <Input type="date" {...form.register('dueDate')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {statusOptions.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
          </Select>
        </F>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : commitment ? 'Save changes' : 'Add commitment'}
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
