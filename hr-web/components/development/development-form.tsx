'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlanCreate } from '@/lib/api/contracts/development';
import type { DevelopmentPlanRow } from '@/lib/api/contracts/development';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { developmentApi } from '@/lib/api/development-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/numbers/uuids on submit. */
type FormValues = {
  employeeId: string; planYear: string; status: string;
  targetCompletionDate: string; summary: string;
};

const STATUSES = ['draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled'];

export function DevelopmentForm({
  plan, options, onSaved, onCancel,
}: {
  plan?: DevelopmentPlanRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(PlanCreate) as never,
    defaultValues: {
      employeeId: plan?.employeeId ?? '',
      planYear: plan?.planYear != null ? String(plan.planYear) : String(new Date().getFullYear()),
      status: plan?.status ?? 'draft',
      targetCompletionDate: day(plan?.targetCompletionDate),
      summary: plan?.summary ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = plan
      ? await developmentApi.update(plan.id, { ...values, expectedUpdatedAt: plan.updatedAt } as never)
      : await developmentApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const employeeName = (e: EmployeeRow) => `${e.firstName} ${e.surname}`;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Plan year" error={err.planYear?.message}>
          <Input type="number" {...form.register('planYear')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
        <F label="Target completion date" error={err.targetCompletionDate?.message}>
          <Input type="date" {...form.register('targetCompletionDate')} />
        </F>
      </div>
      <F label="Summary" error={err.summary?.message}><Textarea {...form.register('summary')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : plan ? 'Save changes' : 'Create plan'}
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
