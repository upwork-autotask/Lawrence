'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PerformanceCreate } from '@/lib/api/contracts/performance';
import type { PerformanceRow, KpiRow } from '@/lib/api/contracts/performance';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { performanceApi } from '@/lib/api/performance-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; kpis: KpiRow[] };

/** Form values are all strings (HTML inputs); Zod coerces numbers/uuids on submit. */
type FormValues = {
  employeeId: string; kpiId: string; periodYear: string; periodQuarter: string;
  targetValue: string; actualValue: string; score: string; weight: string;
  status: string; managerComments: string;
};

const num = (n: number | null | undefined) => (n != null ? String(n) : '');

export function PerformanceForm({
  review, options, onSaved, onCancel,
}: {
  review?: PerformanceRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(PerformanceCreate) as never,
    defaultValues: {
      employeeId: review?.employeeId ?? '',
      kpiId: review?.kpiId ?? '',
      periodYear: review?.periodYear != null ? String(review.periodYear) : String(new Date().getFullYear()),
      periodQuarter: num(review?.periodQuarter),
      targetValue: num(review?.targetValue),
      actualValue: num(review?.actualValue),
      score: num(review?.score),
      weight: review?.weight != null ? String(review.weight) : '1',
      status: review?.status ?? 'draft',
      managerComments: review?.managerComments ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = review
      ? await performanceApi.update(review.id, { ...values, expectedUpdatedAt: review.updatedAt } as never)
      : await performanceApi.create(values as never);
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
        <F label="KPI" error={err.kpiId?.message}>
          <Select {...form.register('kpiId')}>
            <option value="">—</option>
            {options.kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </Select>
        </F>
        <F label="Period year" error={err.periodYear?.message}>
          <Input type="number" {...form.register('periodYear')} />
        </F>
        <F label="Quarter" error={err.periodQuarter?.message}>
          <Input type="number" {...form.register('periodQuarter')} />
        </F>
        <F label="Target value" error={err.targetValue?.message}>
          <Input type="number" step="any" {...form.register('targetValue')} />
        </F>
        <F label="Actual value" error={err.actualValue?.message}>
          <Input type="number" step="any" {...form.register('actualValue')} />
        </F>
        <F label="Score" error={err.score?.message}>
          <Input type="number" step="any" {...form.register('score')} />
        </F>
        <F label="Weight" error={err.weight?.message}>
          <Input type="number" step="any" {...form.register('weight')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="disputed">Disputed</option>
          </Select>
        </F>
      </div>
      <F label="Manager comments" error={err.managerComments?.message}>
        <Textarea {...form.register('managerComments')} />
      </F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : review ? 'Save changes' : 'Create review'}
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
