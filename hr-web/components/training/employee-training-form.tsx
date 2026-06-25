'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EmployeeTrainingInternalCreate,
  EmployeeTrainingExternalCreate,
} from '@/lib/api/contracts/employee-training';
import type {
  EmployeeTrainingInternalRow,
  EmployeeTrainingExternalRow,
} from '@/lib/api/contracts/employee-training';
import type { TrainingRow } from '@/lib/api/contracts/training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import {
  employeeTrainingInternalApi,
  employeeTrainingExternalApi,
} from '@/lib/api/employee-training-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type AnyRow = EmployeeTrainingInternalRow | EmployeeTrainingExternalRow;
type Options = { employees: EmployeeRow[]; trainings: TrainingRow[] };

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

type FormValues = {
  employeeId: string;
  trainingId: string;
  assignedAt: string;
  status: string;
};

/**
 * Assign an internal/external training to an employee (Access
 * TblEmployeeTrainingDetails / TblEmployeeExTrainingDetails subforms). The
 * Training select is filtered to courses of the matching kind.
 */
export function EmployeeTrainingForm({
  variant,
  record,
  options,
  onSaved,
  onCancel,
}: {
  variant: 'internal' | 'external';
  record?: AnyRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const api = variant === 'internal' ? employeeTrainingInternalApi : employeeTrainingExternalApi;
  const schema = variant === 'internal' ? EmployeeTrainingInternalCreate : EmployeeTrainingExternalCreate;

  // Filter the catalogue to the kind matching this register (blended shows in both).
  const trainings = options.trainings.filter(
    (t) => t.kind === variant || t.kind === 'blended',
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema.omit({ trainingType: true })) as never,
    defaultValues: {
      employeeId: record?.employeeId ?? '',
      trainingId: record?.trainingId ?? '',
      assignedAt: day(record?.assignedAt),
      status: record?.status ?? 'assigned',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const trainingType = variant === 'internal' ? 'Internal Training' : 'External Training';
    const payload = { ...values, trainingType };
    const r = record
      ? await api.update(record.id, { ...payload, expectedUpdatedAt: record.updatedAt } as never)
      : await api.create(payload as never);
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
            {options.employees.map((e) => (
              <option key={e.id} value={e.id}>{employeeName(e)}</option>
            ))}
          </Select>
        </F>
        <F label="Training" error={err.trainingId?.message}>
          <Select {...form.register('trainingId')}>
            <option value="">—</option>
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </F>
        <F label="Assigned at" error={err.assignedAt?.message}>
          <Input type="date" {...form.register('assignedAt')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </F>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : record ? 'Save changes' : 'Assign'}
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
