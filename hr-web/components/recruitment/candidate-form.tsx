'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandidateCreate } from '@/lib/api/contracts/recruitment';
import type { CandidateRow } from '@/lib/api/contracts/recruitment';
import { candidatesApi, nonRecruitmentReasonsApi } from '@/lib/api/recruitment-client';
import { lookupsApi } from '@/lib/api/resources';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  firstName: string; surname: string; email: string; phone: string; idNumber: string;
  source: string; cvPath: string; eeGroupId: string; rejectionReasonId: string; status: string;
};

export function CandidateForm({
  requestId, candidate, onSaved, onCancel,
}: {
  requestId: string;
  candidate?: CandidateRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const options = useQuery({
    queryKey: ['candidate-form-options'],
    queryFn: async () => {
      const [ee, reasons] = await Promise.all([
        lookupsApi.list('eeGroups'),
        nonRecruitmentReasonsApi.list({ pageSize: 200 }),
      ]);
      return {
        eeGroups: ee.ok ? ee.value.items : [],
        reasons: reasons.ok ? reasons.value.items : [],
      };
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(CandidateCreate.omit({ requestId: true })) as never,
    defaultValues: {
      firstName: candidate?.firstName ?? '',
      surname: candidate?.surname ?? '',
      email: candidate?.email ?? '',
      phone: candidate?.phone ?? '',
      idNumber: candidate?.idNumber ?? '',
      source: candidate?.source ?? '',
      cvPath: candidate?.cvPath ?? '',
      eeGroupId: candidate?.eeGroupId ?? '',
      rejectionReasonId: candidate?.rejectionReasonId ?? '',
      status: candidate?.status ?? 'applied',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = candidate
      ? await candidatesApi.update(candidate.id, { ...values, requestId, expectedUpdatedAt: candidate.updatedAt } as never)
      : await candidatesApi.create({ ...values, requestId } as never);
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
        <F label="First name" error={err.firstName?.message}><Input {...form.register('firstName')} /></F>
        <F label="Surname" error={err.surname?.message}><Input {...form.register('surname')} /></F>
        <F label="Email" error={err.email?.message}><Input type="email" {...form.register('email')} /></F>
        <F label="Phone" error={err.phone?.message}><Input {...form.register('phone')} /></F>
        <F label="ID number" error={err.idNumber?.message}><Input {...form.register('idNumber')} /></F>
        <F label="Source" error={err.source?.message}><Input {...form.register('source')} /></F>
        <F label="CV path" error={err.cvPath?.message}><Input {...form.register('cvPath')} /></F>
        <F label="EE group" error={err.eeGroupId?.message}>
          <Select {...form.register('eeGroupId')}>
            <option value="">—</option>
            {options.data?.eeGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </F>
        <F label="Rejection reason" error={err.rejectionReasonId?.message}>
          <Select {...form.register('rejectionReasonId')}>
            <option value="">—</option>
            {options.data?.reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </F>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : candidate ? 'Save changes' : 'Add candidate'}
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
