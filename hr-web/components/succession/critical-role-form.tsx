'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CriticalRoleCreate } from '@/lib/api/contracts/succession';
import type { CriticalRoleRow } from '@/lib/api/contracts/succession';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { criticalRolesApi } from '@/lib/api/succession-client';
import { lookupsApi } from '@/lib/api/resources';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

const criticalityReasons = [
  'Legal / Regulatory accountability',
  'SHEQ -critical role',
  'Financial impact',
  'Operational continuity',
  'Scarce skill in labour market',
  'Strategic leadership',
  'Employment Equity',
  'Sales Revenue',
  'Business Continuity',
  'Compliance Critical role',
];
const tierSelections = ['Tier1', 'Tier2', 'Tier3'];

/** Form values are all strings (HTML inputs); Zod coerces uuids/dates on submit. */
type FormValues = {
  title: string; refNo: string; lastReviewDate: string; incumbentEmployeeId: string;
  successorIdentifiedId: string; regionId: string; departmentId: string; jobTitleId: string;
  criticalityReason: string; tierSelection: string; riskLevel: string; status: string; reason: string;
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

  const lookups = useQuery({
    queryKey: ['critical-role-form-lookups'],
    queryFn: async () => {
      const [regions, departments, jobTitles] = await Promise.all([
        lookupsApi.list('regions'),
        lookupsApi.list('departments'),
        lookupsApi.list('jobTitles'),
      ]);
      return {
        regions: regions.ok ? regions.value.items : [],
        departments: departments.ok ? departments.value.items : [],
        jobTitles: jobTitles.ok ? jobTitles.value.items : [],
      };
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(CriticalRoleCreate) as never,
    defaultValues: {
      title: role?.title ?? '',
      refNo: role?.refNo ?? '',
      lastReviewDate: day(role?.lastReviewDate),
      incumbentEmployeeId: role?.incumbentEmployeeId ?? '',
      successorIdentifiedId: role?.successorIdentifiedId ?? '',
      regionId: role?.regionId ?? '',
      departmentId: role?.departmentId ?? '',
      jobTitleId: role?.jobTitleId ?? '',
      criticalityReason: role?.criticalityReason ?? '',
      tierSelection: role?.tierSelection ?? '',
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
        <F label="Ref no" error={err.refNo?.message}><Input {...form.register('refNo')} /></F>
        <F label="Last review date" error={err.lastReviewDate?.message}>
          <Input type="date" {...form.register('lastReviewDate')} />
        </F>
        <F label="Incumbent" error={err.incumbentEmployeeId?.message}>
          <Select {...form.register('incumbentEmployeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Successor identified" error={err.successorIdentifiedId?.message}>
          <Select {...form.register('successorIdentifiedId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}>
            <option value="">—</option>
            {lookups.data?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </F>
        <F label="Department" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}>
            <option value="">—</option>
            {lookups.data?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </F>
        <F label="Job title" error={err.jobTitleId?.message}>
          <Select {...form.register('jobTitleId')}>
            <option value="">—</option>
            {lookups.data?.jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </Select>
        </F>
        <F label="Criticality reason" error={err.criticalityReason?.message}>
          <Select {...form.register('criticalityReason')}>
            <option value="">—</option>
            {criticalityReasons.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </F>
        <F label="Tier selection" error={err.tierSelection?.message}>
          <Select {...form.register('tierSelection')}>
            <option value="">—</option>
            {tierSelections.map((t) => <option key={t} value={t}>{t}</option>)}
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
