'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActualCreate } from '@/lib/api/contracts/ee';
import type { ActualRow } from '@/lib/api/contracts/ee';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { actualRecruitmentApi } from '@/lib/api/ee-client';
import { OCC_LEVELS, EMP_TYPES, GENDERS, RACES, PROGRESS_STATUSES } from '@/lib/ee-options';
import { titleCase } from '@/lib/format';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export type ActualLookups = { regions: LookupRow[]; departments: LookupRow[]; reasons: LookupRow[] };

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const opts = (vals: string[]) => vals.map((v) => <option key={v} value={v}>{v}</option>);
const lopts = (rows: LookupRow[]) => rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>);

export function ActualForm({
  actual, lookups, onSaved, onCancel,
}: {
  actual?: ActualRow | null;
  lookups: ActualLookups;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(ActualCreate) as never,
    defaultValues: {
      dueDate: day(actual?.dueDate),
      regionId: actual?.regionId ?? '',
      departmentId: actual?.departmentId ?? '',
      name: actual?.name ?? '',
      surname: actual?.surname ?? '',
      companyNo: actual?.companyNo ?? '',
      jobTitle: actual?.jobTitle ?? '',
      occupationalLevel: actual?.occupationalLevel ?? '',
      employmentType: actual?.employmentType ?? '',
      gender: actual?.gender ?? '',
      race: actual?.race ?? '',
      value: actual?.value != null ? String(actual.value) : '1',
      reasonForAppointment: actual?.reasonForAppointment ?? '',
      responsibleExecutive: actual?.responsibleExecutive ?? '',
      responsibleManager: actual?.responsibleManager ?? '',
      progressStatus: actual?.progressStatus ?? 'appointed',
      reason: actual?.reason ?? '',
      nonEe: actual ? actual.nonEe : false,
      approval: actual?.approval ?? '',
      nonRecruitmentReasonId: actual?.nonRecruitmentReasonId ?? '',
      supportingDocument: actual?.supportingDocument ?? '',
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = actual
      ? await actualRecruitmentApi.update(actual.id, { ...values, expectedUpdatedAt: actual.updatedAt } as never)
      : await actualRecruitmentApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const reg = (n: string) => form.register(n as never);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Appointee</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FormField label="Name" error={err.name?.message}><Input {...reg('name')} /></FormField>
          <FormField label="Surname" error={err.surname?.message}><Input {...reg('surname')} /></FormField>
          <FormField label="Company no." error={err.companyNo?.message}><Input {...reg('companyNo')} /></FormField>
          <FormField label="Date" error={err.dueDate?.message}><Input type="date" {...reg('dueDate')} /></FormField>
          <FormField label="Region" error={err.regionId?.message}>
            <Select {...reg('regionId')}><option value="">—</option>{lopts(lookups.regions)}</Select>
          </FormField>
          <FormField label="Department" error={err.departmentId?.message}>
            <Select {...reg('departmentId')}><option value="">—</option>{lopts(lookups.departments)}</Select>
          </FormField>
          <FormField label="Job title" error={err.jobTitle?.message}><Input {...reg('jobTitle')} /></FormField>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Employment equity</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FormField label="Occupational level" error={err.occupationalLevel?.message}>
            <Select {...reg('occupationalLevel')}><option value="">—</option>{opts(OCC_LEVELS)}</Select>
          </FormField>
          <FormField label="Employment type" error={err.employmentType?.message}>
            <Select {...reg('employmentType')}><option value="">—</option>{opts(EMP_TYPES)}</Select>
          </FormField>
          <FormField label="Gender" error={err.gender?.message}>
            <Select {...reg('gender')}><option value="">—</option>{opts(GENDERS)}</Select>
          </FormField>
          <FormField label="Race" error={err.race?.message}>
            <Select {...reg('race')}><option value="">—</option>{opts(RACES)}</Select>
          </FormField>
          <FormField label="Value" error={err.value?.message}><Input type="number" {...reg('value')} /></FormField>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...reg('nonEe')} /> Non-EE appointment
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Appointment &amp; approval</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FormField label="Responsible executive" error={err.responsibleExecutive?.message}><Input {...reg('responsibleExecutive')} /></FormField>
          <FormField label="Responsible manager" error={err.responsibleManager?.message}><Input {...reg('responsibleManager')} /></FormField>
          <FormField label="Progress status" error={err.progressStatus?.message}>
            <Select {...reg('progressStatus')}>{PROGRESS_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select>
          </FormField>
          <FormField label="Approval" error={err.approval?.message}><Input {...reg('approval')} /></FormField>
          <FormField label="Non-recruitment reason" error={err.nonRecruitmentReasonId?.message}>
            <Select {...reg('nonRecruitmentReasonId')}><option value="">—</option>{lopts(lookups.reasons)}</Select>
          </FormField>
          <FormField label="Supporting document" error={err.supportingDocument?.message}><Input {...reg('supportingDocument')} placeholder="ref / link" /></FormField>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Reason for appointment" error={err.reasonForAppointment?.message}><Textarea rows={2} {...reg('reasonForAppointment')} /></FormField>
          <FormField label="Reason / notes" error={err.reason?.message}><Textarea rows={2} {...reg('reason')} /></FormField>
        </div>
      </section>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : actual ? 'Save changes' : 'Add appointment'}
        </Button>
      </div>
    </form>
  );
}
