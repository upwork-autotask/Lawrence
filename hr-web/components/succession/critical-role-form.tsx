'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CriticalRoleCreate } from '@/lib/api/contracts/succession';
import type { CriticalRoleRow } from '@/lib/api/contracts/succession';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { criticalRolesApi } from '@/lib/api/succession-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[] };

/** Form values are all strings (HTML inputs); Zod coerces uuids on submit. */
type FormValues = {
  title: string; incumbentEmployeeId: string; riskLevel: string; status: string; reason: string;
};

export function CriticalRoleForm({
  role, options, onSaved, onCancel,
}: {
  role?: CriticalRoleRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CriticalRoleCreate) as never,
    defaultValues: {
      title: role?.title ?? '',
      incumbentEmployeeId: role?.incumbentEmployeeId ?? '',
      riskLevel: role?.riskLevel ?? 'medium',
      status: role?.status ?? 'open',
      reason: role?.reason ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = role
      ? await criticalRolesApi.update(role.id, { ...values, expectedUpdatedAt: role.updatedAt } as never)
      : await criticalRolesApi.create(values as never);
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
      <F label="Title" error={err.title?.message}><Input {...form.register('title')} /></F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Incumbent" error={err.incumbentEmployeeId?.message}>
          <Select {...form.register('incumbentEmployeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Risk level" error={err.riskLevel?.message}>
          <Select {...form.register('riskLevel')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </Select>
        </F>
      </div>
      <F label="Reason" error={err.reason?.message}><Textarea {...form.register('reason')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : role ? 'Save changes' : 'Create role'}
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
