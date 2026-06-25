'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ExitCreate } from '@/lib/api/contracts/exit';
import type { ExitRecordRow, ExitReasonRow } from '@/lib/api/contracts/exit';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { exitRecordsApi } from '@/lib/api/exit-client';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; reasons: ExitReasonRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

const exitTypes = ['resignation', 'dismissal', 'retirement', 'retrenchment', 'end_of_contract', 'death'];
const statuses = ['initiated', 'in_progress', 'completed', 'cancelled'];
const occupationalLevels = ['Top Mgmt', 'Senior Mgmt', 'Middle Mgmt', 'Junior Mgmt', 'Semi-Skilled', 'Unskilled'];

/** Form values are all strings (HTML inputs); Zod coerces dates/uuids/bools on submit. */
type FormValues = {
  employeeId: string; exitType: string; reasonId: string; noticeDate: string;
  lastWorkingDay: string; interviewDate: string; interviewerId: string; interviewNotes: string;
  regionId: string; departmentId: string; jobTitleId: string; occupationalLevel: string; reasonCode: string;
  rehireEligible: string; assetsReturned: boolean; finalSettlementPaid: boolean; status: string;
};

export function ExitForm({
  record, options, onSaved, onCancel,
}: {
  record?: ExitRecordRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const interviewers = useQuery({
    queryKey: ['exit-form-employees'],
    queryFn: async () => {
      const r = await employeesApi.list({ pageSize: 1000 });
      return r.ok ? r.value.items : [];
    },
  });

  const lookups = useQuery({
    queryKey: ['exit-form-lookups'],
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
    resolver: zodResolver(ExitCreate) as never,
    defaultValues: {
      employeeId: record?.employeeId ?? '',
      exitType: record?.exitType ?? 'resignation',
      reasonId: record?.reasonId ?? '',
      noticeDate: day(record?.noticeDate),
      lastWorkingDay: day(record?.lastWorkingDay),
      interviewDate: day(record?.interviewDate),
      interviewerId: record?.interviewerId ?? '',
      interviewNotes: record?.interviewNotes ?? '',
      regionId: record?.regionId ?? '',
      departmentId: record?.departmentId ?? '',
      jobTitleId: record?.jobTitleId ?? '',
      occupationalLevel: record?.occupationalLevel ?? '',
      reasonCode: record?.reasonCode ?? '',
      rehireEligible: record?.rehireEligible ? 'true' : '',
      assetsReturned: record?.assetsReturned ?? false,
      finalSettlementPaid: record?.finalSettlementPaid ?? false,
      status: record?.status ?? 'initiated',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = record
      ? await exitRecordsApi.update(record.id, { ...values, expectedUpdatedAt: record.updatedAt } as never)
      : await exitRecordsApi.create(values as never);
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
        <F label="Exit type" error={err.exitType?.message}>
          <Select {...form.register('exitType')}>
            {exitTypes.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </F>
        <F label="Reason" error={err.reasonId?.message}>
          <Select {...form.register('reasonId')}>
            <option value="">—</option>
            {options.reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </F>
        <F label="Reason code" error={err.reasonCode?.message}><Input {...form.register('reasonCode')} /></F>
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
        <F label="Occupational level" error={err.occupationalLevel?.message}>
          <Select {...form.register('occupationalLevel')}>
            <option value="">—</option>
            {occupationalLevels.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {statuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
        <F label="Notice date" error={err.noticeDate?.message}><Input type="date" {...form.register('noticeDate')} /></F>
        <F label="Last working day" error={err.lastWorkingDay?.message}><Input type="date" {...form.register('lastWorkingDay')} /></F>
        <F label="Interview date" error={err.interviewDate?.message}><Input type="date" {...form.register('interviewDate')} /></F>
        <F label="Interviewed by" error={err.interviewerId?.message}>
          <Select {...form.register('interviewerId')}>
            <option value="">—</option>
            {interviewers.data?.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Rehire eligible" error={err.rehireEligible?.message}>
          <Select {...form.register('rehireEligible')}>
            <option value="">—</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </F>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" {...form.register('assetsReturned')} /> Assets returned
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" {...form.register('finalSettlementPaid')} /> Final settlement paid
        </label>
      </div>
      <F label="Interview notes" error={err.interviewNotes?.message}><Textarea {...form.register('interviewNotes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : record ? 'Save changes' : 'Create exit record'}
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
