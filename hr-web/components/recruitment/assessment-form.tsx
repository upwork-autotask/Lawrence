'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandidateAssessmentCreate } from '@/lib/api/contracts/recruitment-assessment';
import type { CandidateAssessmentRow } from '@/lib/api/contracts/recruitment-assessment';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { candidateAssessmentsApi } from '@/lib/api/recruitment-assessment-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const numStr = (n: number | null | undefined) => (n != null ? String(n) : '');

/** value/label pairs, value = the leading integer code from each Access value-list. */
type Opt = { value: string; label: string };
const yesNo21: Opt[] = [
  { value: '2', label: 'Yes' },
  { value: '1', label: 'No' },
];
const years15: Opt[] = [
  { value: '1', label: '0-1 Years' },
  { value: '2', label: '2-3' },
  { value: '3', label: '4-6' },
  { value: '4', label: '7-10' },
  { value: '5', label: 'More than 10 years' },
];
const oneToFive: Opt[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

/** Scored questions — verbatim labels + value lists from the access-parity audit. */
const SCORED: { name: string; label: string; options: Opt[] }[] = [
  {
    name: 'qualificationRelevant',
    label: 'Is the qualification relevant to the position applied for?',
    options: [
      { value: '3', label: 'Yes' },
      { value: '2', label: 'It has some concept that are Common' },
      { value: '1', label: 'No' },
    ],
  },
  { name: 'yearsExperienceField', label: 'How many years of experience does the candidate have in this field', options: years15 },
  { name: 'yearsExperienceIndustry', label: 'How many years of experience does the candidate have in this Industry', options: years15 },
  {
    name: 'budgetFinanceExperience',
    label: 'Does the candidate have any experience in budget control or finance',
    options: yesNo21,
  },
  {
    name: 'managedEmployees',
    label: 'Have you managed other employees before?(for management positions)',
    options: [
      { value: '3', label: 'Yes' },
      { value: '2', label: 'Indirectly' },
      { value: '1', label: 'No' },
    ],
  },
  {
    name: 'creditCheck',
    label: 'Report On Credit Check',
    options: [
      { value: '3', label: 'Passed' },
      { value: '2', label: 'Had Some Problem in the PAST' },
      { value: '1', label: 'Failed' },
    ],
  },
  {
    name: 'eeGroup',
    label: 'Which Employment Equity Group does the Candidate belong to?',
    options: [
      { value: '3', label: 'Black People (black people,coloureds or indians)' },
      { value: '2', label: 'Women' },
      { value: '1', label: 'People with Disabilities' },
      { value: '0', label: 'Priviously Avantaged Group (i.e White Male)' },
    ],
  },
  {
    name: 'demographic',
    label: 'What is the Demographic of candidate ?',
    options: [
      { value: '6', label: 'Black Female' },
      { value: '5', label: 'Black Male &  Female (Indian, Coloured,)' },
      { value: '4', label: 'White Female & Coloured /Indian Male' },
      { value: '3', label: 'White Male' },
      { value: '2', label: 'Disabled' },
      { value: '1', label: 'Foreigner' },
    ],
  },
  { name: 'meetsEePolicy', label: 'Does the appointment meet the employment equity policy objective', options: yesNo21 },
  { name: 'computerLiterate', label: 'Is the candidate computer literate?', options: yesNo21 },
  { name: 'sheqIsoKnowledge', label: 'Does the candidate have any SHEQ or ISO knowledge or experience?', options: yesNo21 },
  { name: 'hrSkills', label: 'Does the candidate have any human resources skills ie discipline', options: yesNo21 },
  {
    name: 'highestQualification',
    label: 'What is the highest Qualifications that the Candidate has?',
    options: [
      { value: '1', label: 'Grade 10 standard 8' },
      { value: '2', label: 'Matric NQF 4' },
      { value: '3', label: 'Certificate NQF 5' },
      { value: '4', label: 'Diploma NQF 6' },
      { value: '5', label: 'Degree NQF 7' },
      { value: '6', label: 'Master NQF 8' },
      { value: '7', label: 'Honors NQF 9' },
    ],
  },
  { name: 'employedBefore', label: 'Has the candidate been employed before?-', options: yesNo21 },
  { name: 'abilityToCompleteTask', label: 'Ability to complete task', options: oneToFive },
  { name: 'attendance', label: 'Attendance at work', options: oneToFive },
];

const NARRATIVES: { name: string; label: string }[] = [
  { name: 'strengths', label: 'Strengths' },
  { name: 'weaknesses', label: 'Weaknesses' },
  { name: 'eeJustification', label: "Why isn't this an EE appointment?" },
  { name: 'otherQualifications', label: 'List Any Other Qualifications' },
  { name: 'companiesWorkedFor', label: 'Companies worked for in past 10 years' },
  { name: 'companyName', label: 'Name of company' },
  { name: 'referenceRemark', label: 'Reference verification remark' },
  { name: 'homeAddress', label: 'Home address' },
];

const SCORED_NAMES = SCORED.map((q) => q.name);

type FormValues = Record<string, string>;

export function AssessmentForm({
  candidateId,
  assessment,
  jobTitles,
  regions,
  departments,
  onSaved,
  onCancel,
}: {
  candidateId: string;
  assessment?: CandidateAssessmentRow | null;
  jobTitles: LookupRow[];
  regions: LookupRow[];
  departments: LookupRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaults: FormValues = {
    candidateId: assessment?.candidateId ?? candidateId,
    appliedJobTitleId: assessment?.appliedJobTitleId ?? '',
    regionId: assessment?.regionId ?? '',
    departmentId: assessment?.departmentId ?? '',
    applicationType: assessment?.applicationType ?? '',
    gender: assessment?.gender ?? '',
    phone: assessment?.phone ?? '',
    assessmentReportPath: assessment?.assessmentReportPath ?? '',
    assessedAt: day(assessment?.assessedAt),
  };
  for (const q of SCORED) defaults[q.name] = numStr((assessment as never as Record<string, number | null>)?.[q.name]);
  for (const n of NARRATIVES) defaults[n.name] = (assessment as never as Record<string, string | null>)?.[n.name] ?? '';

  const form = useForm<FormValues>({
    resolver: zodResolver(CandidateAssessmentCreate) as never,
    defaultValues: defaults,
  });
  const err = form.formState.errors as Record<string, { message?: string }>;

  // Live running total (mirrors the server's sum of scored integer answers).
  const watched = form.watch(SCORED_NAMES as never) as unknown as string[];
  const liveTotal = watched.reduce((acc, v) => acc + (v ? Number(v) || 0 : 0), 0);

  async function submit(values: FormValues) {
    setServerError(null);
    const r = assessment
      ? await candidateAssessmentsApi.update(assessment.id, { ...values, expectedUpdatedAt: assessment.updatedAt } as never)
      : await candidateAssessmentsApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const lookupOpts = (rows: LookupRow[]) => rows.map((l) => <option key={l.id} value={l.id}>{l.name}</option>);

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <input type="hidden" {...form.register('candidateId')} />

      <div className="grid grid-cols-2 gap-4">
        <F label="What position is Being Applied For" error={err.appliedJobTitleId?.message}>
          <Select {...form.register('appliedJobTitleId')}><option value="">—</option>{lookupOpts(jobTitles)}</Select>
        </F>
        <F label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}><option value="">—</option>{lookupOpts(regions)}</Select>
        </F>
        <F label="Department (where will the candidate be placed)" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}><option value="">—</option>{lookupOpts(departments)}</Select>
        </F>
        <F label="This Application Is An" error={err.applicationType?.message}>
          <Select {...form.register('applicationType')}>
            <option value="">—</option>
            <option value="Internal Applicant">Internal Applicant</option>
            <option value="For Promotion">For Promotion</option>
            <option value="External Candidate">External Candidate</option>
          </Select>
        </F>
        <F label="Select Gender" error={err.gender?.message}>
          <Select {...form.register('gender')}>
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
        </F>
        <F label="Phone" error={err.phone?.message}><Input {...form.register('phone')} /></F>
        <F label="Timestamp (assessed on)" error={err.assessedAt?.message}>
          <Input type="date" {...form.register('assessedAt')} />
        </F>
        <F label="Assessment report (reference / link)" error={err.assessmentReportPath?.message}>
          <Input {...form.register('assessmentReportPath')} />
        </F>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="mb-3 text-sm font-medium">Scored assessment</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SCORED.map((q) => (
            <F key={q.name} label={q.label} error={err[q.name]?.message}>
              <Select {...form.register(q.name)}>
                <option value="">—</option>
                {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </F>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">Running total: {liveTotal}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {NARRATIVES.map((n) => (
          <F key={n.name} label={n.label} error={err[n.name]?.message}>
            <Textarea {...form.register(n.name)} />
          </F>
        ))}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : assessment ? 'Save changes' : 'Create assessment'}
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
