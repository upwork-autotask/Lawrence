'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequestCreate } from '@/lib/api/contracts/recruitment';
import type { RequestRow } from '@/lib/api/contracts/recruitment';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { requestsApi } from '@/lib/api/recruitment-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Lookups = { departments: LookupRow[]; regions: LookupRow[]; jobTitles: LookupRow[] };

/** ISO string → value for <input type="date"> (yyyy-MM-dd). */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Form values are all strings (HTML inputs); Zod coerces numbers/uuids on submit. */
type FormValues = {
  positionTitle: string; departmentId: string; regionId: string; jobTitleId: string;
  headcount: string; motivation: string; employmentType: string; targetStartDate: string; status: string;
};

export function RequestForm({
  request, lookups, onSaved, onCancel,
}: {
  request?: RequestRow | null;
  lookups: Lookups;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(RequestCreate) as never,
    defaultValues: {
      positionTitle: request?.positionTitle ?? '',
      departmentId: request?.departmentId ?? '',
      regionId: request?.regionId ?? '',
      jobTitleId: request?.jobTitleId ?? '',
      headcount: request?.headcount != null ? String(request.headcount) : '1',
      motivation: request?.motivation ?? '',
      employmentType: request?.employmentType ?? '',
      targetStartDate: toDateInput(request?.targetStartDate ?? null),
      status: request?.status ?? 'draft',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = request
      ? await requestsApi.update(request.id, { ...values, expectedUpdatedAt: request.updatedAt } as never)
      : await requestsApi.create(values as never);
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
        <F label="Position title" error={err.positionTitle?.message}><Input {...form.register('positionTitle')} /></F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="advertised">Advertised</option>
            <option value="interviewing">Interviewing</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </F>
        <F label="Department" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}>
            <option value="">—</option>
            {lookups.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </F>
        <F label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}>
            <option value="">—</option>
            {lookups.regions.map((rg) => <option key={rg.id} value={rg.id}>{rg.name}</option>)}
          </Select>
        </F>
        <F label="Job title" error={err.jobTitleId?.message}>
          <Select {...form.register('jobTitleId')}>
            <option value="">—</option>
            {lookups.jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </Select>
        </F>
        <F label="Headcount" error={err.headcount?.message}>
          <Input type="number" step="1" min="1" {...form.register('headcount')} />
        </F>
        <F label="Employment type" error={err.employmentType?.message}>
          <Input {...form.register('employmentType')} />
        </F>
        <F label="Target start date" error={err.targetStartDate?.message}>
          <Input type="date" {...form.register('targetStartDate')} />
        </F>
      </div>
      <F label="Motivation" error={err.motivation?.message}><Textarea {...form.register('motivation')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : request ? 'Save changes' : 'Create requisition'}
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
