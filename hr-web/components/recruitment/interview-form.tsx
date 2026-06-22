'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterviewCreate } from '@/lib/api/contracts/recruitment';
import type { CandidateRow, InterviewRow } from '@/lib/api/contracts/recruitment';
import { interviewsApi } from '@/lib/api/recruitment-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type FormValues = {
  candidateId: string; scheduledAt: string; stage: string; status: string;
};

/** ISO string → value for <input type="datetime-local"> (yyyy-MM-ddTHH:mm). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewForm({
  requestId, candidates, interview, onSaved, onCancel,
}: {
  requestId: string;
  candidates: CandidateRow[];
  interview?: InterviewRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(InterviewCreate.omit({ requestId: true })) as never,
    defaultValues: {
      candidateId: interview?.candidateId ?? '',
      scheduledAt: toLocalInput(interview?.scheduledAt ?? null),
      stage: interview?.stage ?? 'first',
      status: interview?.status ?? 'scheduled',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = interview
      ? await interviewsApi.update(interview.id, { ...values, requestId, expectedUpdatedAt: interview.updatedAt } as never)
      : await interviewsApi.create({ ...values, requestId } as never);
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
        <F label="Candidate" error={err.candidateId?.message}>
          <Select {...form.register('candidateId')}>
            <option value="">—</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>
            ))}
          </Select>
        </F>
        <F label="Scheduled at" error={err.scheduledAt?.message}>
          <Input type="datetime-local" {...form.register('scheduledAt')} />
        </F>
        <F label="Stage" error={err.stage?.message}>
          <Select {...form.register('stage')}>
            <option value="screening">Screening</option>
            <option value="first">First</option>
            <option value="second">Second</option>
            <option value="final">Final</option>
            <option value="panel">Panel</option>
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </Select>
        </F>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : interview ? 'Save changes' : 'Add interview'}
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
