'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JdGradeEvalCreate } from '@/lib/api/contracts/jd-grade-eval';
import type { JdGradeEvalRow } from '@/lib/api/contracts/jd-grade-eval';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { jdGradeEvalApi } from '@/lib/api/jd-grade-eval-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Exact Access value-lists (frmEval).
export const FACTORS = [
  'Decision Making',
  'Problem Solving',
  'Financial Impact',
  'People Management',
  'Compliance & Risk',
  'Planning Horizon',
] as const;
export const OCCUPATIONAL_LEVELS = [
  'Top Mgmt',
  'Senior Mgmt',
  'Middle Mgmt',
  'Junior Mgmt',
  'Semi-Skilled',
  'Unskilled',
] as const;
export const CEO_APPROVALS = ['Yes', 'No'] as const;

/** Form values are all strings (HTML inputs); Zod coerces uuids/nulls on submit. */
type FormValues = {
  jobTitleId: string;
  occupationalLevel: string;
  factor: string;
  assessment: string;
  justificationFromJd: string;
  additionalPortfolios: string;
  gradeImpactReview: string;
  recommendedGrading: string;
  notes: string;
  ceoApproval: string;
};

export function EvalForm({
  evaluation,
  jobTitles,
  onSaved,
  onCancel,
}: {
  evaluation?: JdGradeEvalRow | null;
  jobTitles: LookupRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(JdGradeEvalCreate) as never,
    defaultValues: {
      jobTitleId: evaluation?.jobTitleId ?? '',
      occupationalLevel: evaluation?.occupationalLevel ?? '',
      factor: evaluation?.factor ?? '',
      assessment: evaluation?.assessment ?? '',
      justificationFromJd: evaluation?.justificationFromJd ?? '',
      additionalPortfolios: evaluation?.additionalPortfolios ?? '',
      gradeImpactReview: evaluation?.gradeImpactReview ?? '',
      recommendedGrading: evaluation?.recommendedGrading ?? '',
      notes: evaluation?.notes ?? '',
      ceoApproval: evaluation?.ceoApproval ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = evaluation
      ? await jdGradeEvalApi.update(evaluation.id, { ...values, expectedUpdatedAt: evaluation.updatedAt } as never)
      : await jdGradeEvalApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  // Keep any imported value the dropdowns don't list selectable so it isn't lost.
  const occ = evaluation?.occupationalLevel ?? '';
  const fac = evaluation?.factor ?? '';

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Job title" error={err.jobTitleId?.message}>
          <Select {...form.register('jobTitleId')}>
            <option value="">—</option>
            {jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </Select>
        </F>
        <F label="Occupational level" error={err.occupationalLevel?.message}>
          <Select {...form.register('occupationalLevel')}>
            <option value="">—</option>
            {occ && !OCCUPATIONAL_LEVELS.includes(occ as never) && <option value={occ}>{occ}</option>}
            {OCCUPATIONAL_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </F>
        <F label="Factor" error={err.factor?.message}>
          <Select {...form.register('factor')}>
            <option value="">—</option>
            {fac && !FACTORS.includes(fac as never) && <option value={fac}>{fac}</option>}
            {FACTORS.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
        </F>
        <F label="CEO approval" error={err.ceoApproval?.message}>
          <Select {...form.register('ceoApproval')}>
            <option value="">—</option>
            {CEO_APPROVALS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </F>
        <F label="Recommended JD grading" error={err.recommendedGrading?.message}>
          <Input {...form.register('recommendedGrading')} />
        </F>
      </div>
      <F label="Assessment" error={err.assessment?.message}>
        <Textarea {...form.register('assessment')} />
      </F>
      <F label="Justification from JD" error={err.justificationFromJd?.message}>
        <Textarea {...form.register('justificationFromJd')} />
      </F>
      <F label="Additional portfolios / expanded scope" error={err.additionalPortfolios?.message}>
        <Textarea {...form.register('additionalPortfolios')} />
      </F>
      <F label="Grade impact review" error={err.gradeImpactReview?.message}>
        <Textarea {...form.register('gradeImpactReview')} />
      </F>
      <F label="Notes" error={err.notes?.message}>
        <Textarea {...form.register('notes')} />
      </F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : evaluation ? 'Save changes' : 'Create evaluation'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const child = React.isValidElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? generatedId,
        'aria-describedby': errorId,
        'aria-invalid': error ? true : undefined,
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
