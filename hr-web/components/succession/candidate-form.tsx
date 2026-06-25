'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandidateCreate } from '@/lib/api/contracts/succession';
import type { SuccessionCandidateRow } from '@/lib/api/contracts/succession';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { successionCandidatesApi } from '@/lib/api/succession-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const readinessOptions = ['ready_now', '1_2_years', '3_5_years'];
const statusOptions = ['identified', 'in_development', 'ready', 'placed', 'withdrawn'];
const assessmentTiers = ['Tier1', 'Tier2', 'Tier3'];
const possibleTargetPlans = ['Promotion', 'Sucession', 'Recruitment (Ext)'];
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  employeeId: string; dateInitiated: string; identifiedSuccessionPosition: string;
  lineManager: string; assessmentTier: string; subTier: string; focusArea: string;
  qualificationReq: string; experienceReq: string; psychologicalReq: string;
  culturalFitReq: string; complianceReq: string; possibleTargetPlan: string;
  readiness: string; performanceRating: string;
  potentialRating: string; developmentNeeds: string; isPrimary: string; status: string;
};

export function CandidateForm({
  criticalRoleId, candidate, employees, onSaved, onCancel,
}: {
  criticalRoleId: string;
  candidate?: SuccessionCandidateRow | null;
  employees: EmployeeRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CandidateCreate.omit({ criticalRoleId: true })) as never,
    defaultValues: {
      employeeId: candidate?.employeeId ?? '',
      dateInitiated: day(candidate?.dateInitiated),
      identifiedSuccessionPosition: candidate?.identifiedSuccessionPosition ?? '',
      lineManager: candidate?.lineManager ?? '',
      assessmentTier: candidate?.assessmentTier ?? '',
      subTier: candidate?.subTier ?? '',
      focusArea: candidate?.focusArea ?? '',
      qualificationReq: candidate?.qualificationReq ?? '',
      experienceReq: candidate?.experienceReq ?? '',
      psychologicalReq: candidate?.psychologicalReq ?? '',
      culturalFitReq: candidate?.culturalFitReq ?? '',
      complianceReq: candidate?.complianceReq ?? '',
      possibleTargetPlan: candidate?.possibleTargetPlan ?? '',
      readiness: candidate?.readiness ?? '1_2_years',
      performanceRating: candidate?.performanceRating ?? '',
      potentialRating: candidate?.potentialRating ?? '',
      developmentNeeds: candidate?.developmentNeeds ?? '',
      isPrimary: candidate ? (candidate.isPrimary ? 'true' : 'false') : 'false',
      status: candidate?.status ?? 'identified',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = candidate
      ? await successionCandidatesApi.update(candidate.id, { ...values, expectedUpdatedAt: candidate.updatedAt } as never)
      : await successionCandidatesApi.create({ ...values, criticalRoleId } as never);
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
            {employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Date initiated" error={err.dateInitiated?.message}>
          <Input type="date" {...form.register('dateInitiated')} />
        </F>
        <F label="Identified succession position" error={err.identifiedSuccessionPosition?.message}>
          <Input {...form.register('identifiedSuccessionPosition')} />
        </F>
        <F label="Line manager" error={err.lineManager?.message}>
          <Input {...form.register('lineManager')} />
        </F>
        <F label="Assessment tier" error={err.assessmentTier?.message}>
          <Select {...form.register('assessmentTier')}>
            <option value="">—</option>
            {assessmentTiers.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </F>
        <F label="Sub-tier" error={err.subTier?.message}>
          <Input {...form.register('subTier')} />
        </F>
        <F label="Focus area" error={err.focusArea?.message}>
          <Input {...form.register('focusArea')} />
        </F>
        <F label="Possible target plan" error={err.possibleTargetPlan?.message}>
          <Select {...form.register('possibleTargetPlan')}>
            <option value="">—</option>
            {possibleTargetPlans.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </F>
        <F label="Readiness" error={err.readiness?.message}>
          <Select {...form.register('readiness')}>
            {readinessOptions.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
          </Select>
        </F>
        <F label="Performance rating" error={err.performanceRating?.message}>
          <Input {...form.register('performanceRating')} />
        </F>
        <F label="Potential rating" error={err.potentialRating?.message}>
          <Input {...form.register('potentialRating')} />
        </F>
        <F label="Primary" error={err.isPrimary?.message}>
          <Select {...form.register('isPrimary')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {statusOptions.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
          </Select>
        </F>
      </div>
      <F label="Development needs" error={err.developmentNeeds?.message}>
        <Textarea {...form.register('developmentNeeds')} />
      </F>
      <F label="Qualification requirements" error={err.qualificationReq?.message}>
        <Textarea {...form.register('qualificationReq')} />
      </F>
      <F label="Experience requirements" error={err.experienceReq?.message}>
        <Textarea {...form.register('experienceReq')} />
      </F>
      <F label="Psychological requirements" error={err.psychologicalReq?.message}>
        <Textarea {...form.register('psychologicalReq')} />
      </F>
      <F label="Cultural fit requirements" error={err.culturalFitReq?.message}>
        <Textarea {...form.register('culturalFitReq')} />
      </F>
      <F label="Compliance requirements" error={err.complianceReq?.message}>
        <Textarea {...form.register('complianceReq')} />
      </F>
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
